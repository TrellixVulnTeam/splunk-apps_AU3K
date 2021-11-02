# standard packages
from functools import wraps
import json
import sys
import traceback
import http.client
from os import path
from future.utils import with_metaclass
lib_dir = path.dirname(path.dirname(path.abspath(__file__)))  # noqa
sys.path.append(lib_dir)  # noqa
sys.path.append(path.join(path.dirname(lib_dir), 'external_lib'))  # noqa

# third-party packages
from routes import Mapper

from splunk.persistconn.application import PersistentServerConnectionApplication
# Custom packages
from .session import session
from logging_utils import log
from .exception import BaseRestException
from utils.i18n_py23 import _

try:
    basestring
except NameError:
    basestring = str

logger = log.getLogger()

HTTP_VERBS = ['get', 'post', 'put', 'patch', 'delete']
HTTP_STATUS_CODES = set(http.client.responses.keys())


def route(path, methods=None):
    '''
    Decorator method for registering route and route handler.
    MUST be used inside of class whose metaclass is RequestHandlerType
    '''
    if not isinstance(path, basestring):
        raise TypeError('path should be a string')

    method_set = set()
    if methods is None:
        method_set = {m for m in HTTP_VERBS}
    elif not isinstance(methods, list):
        raise TypeError('methods should be a list')
    else:
        for m in methods:
            m = m.lower()
            if m not in HTTP_VERBS:
                raise TypeError('methods should be one of %s, but instead got %s' % (HTTP_VERBS, m))
            method_set.add(m)

    def route_register(func):
        func.path = path
        func.allowed_methods = method_set
        func.is_handler = True

        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return route_register


class RequestHandlerType(type):
    '''
    Metaclass for class that serves as a REST handler. It registers all the
    methods that are decorated with the @route decorator as route handlers.
    '''
    def __new__(cls, name, bases, dct):
        result = super(RequestHandlerType, cls).__new__(cls, name, bases, dct)
        registered_routes = Mapper()

        for name, val in dct.items():
            if getattr(val, 'is_handler', 0):
                registered_routes.connect(None, val.path, handler=val)
        result._routes = registered_routes
        return result


class Request(object):
    '''
    Basic REST request class
    '''
    def __init__(self, path, full_path, method, headers, data, query, session):
        self.path = path
        self.full_path = full_path
        self.method = method
        self.headers = headers
        self.data = data
        self.query = query
        self.session = session

    @staticmethod
    def build_from_splunkd_request(splunkd_req):
        path = splunkd_req.get('path_info', '')
        full_path = splunkd_req['rest_path']
        method = splunkd_req['method']
        headers = dict(splunkd_req['headers'])
        query = dict(splunkd_req.get('query', []))
        session = splunkd_req['session']
        # We store global session-related info in the user session for ease of use
        session['global.system_authtoken'] = splunkd_req.get('system_authtoken')
        if 'Content-Type' in headers and headers['Content-Type'].lower().startswith('application/json'):
            data = json.loads(splunkd_req.get('payload', '{}'))
        else:
            data = dict(splunkd_req.get('form', []))
        return Request(path, full_path, method, headers, data, query, session)

    def to_json(self):
        return json.dumps(vars(self))


class BaseRestInterfaceSplunkd(with_metaclass(RequestHandlerType, PersistentServerConnectionApplication)):
    '''
    Base REST interface class.

    It provides session management, request/response parsing and routing by default.
    Subclasses of this class will only need to worry about REST handler method that
    interacts with business logic.

    NOTE: this class MUST NOT be imported directly into a module that defines the
    REST handler class that inherits from it due to the constraint imposed by splunkd.
    To inherit it, import the rest_interface_splunkd module and refer to this class as
    rest_interface_splunkd.BaseRestInterfaceSplunkd
    '''

    def __init__(self, command_line, command_arg):
        super(BaseRestInterfaceSplunkd, self).__init__()

    def handle(self, in_string):
        '''
        Implementation of handle method defined in PersistentServerConnectionApplication.
        '''
        request_obj = self.extract_args(in_string)
        try:
            session.save(**request_obj.session)
            handler, args = self._get_request_handler_and_args(
                request_obj.path,
                request_obj.method
            )

            self.execute_before_handle_hooks(request_obj)
            status_code, response = handler(self, request_obj, **args)
            return self._response(status_code, response)
        except BaseRestException as e:
            return self._response(e.code, e.msg)
        except Exception as e:
            logger.error('Invalid response - Error: %s' % e.args[0])
            logger.debug(traceback.format_exc())
            return self._response(http.client.INTERNAL_SERVER_ERROR, _('Internal Server Error'))
        finally:
            session.clear()

    def execute_before_handle_hooks(self, request):
        hooks = getattr(self, '_registered_before_handle_hooks', [])
        for hook in hooks:
            hook.execute(request)

    def _get_request_handler_and_args(self, path, method):
        matched_handler = self._routes.match('/' + path if path != '' else path)
        route_handler = matched_handler.pop('handler') if matched_handler else None

        if route_handler:
            if method.lower() not in route_handler.allowed_methods:
                raise BaseRestException(
                    http.client.BAD_REQUEST,
                    _('REST method %(method)s not allowed') % {'method': method}
                )
            return route_handler, matched_handler
        else:
            raise BaseRestException(http.client.NOT_FOUND, _('Not Found'))

    def extract_args(self, in_string):
        try:
            args = json.loads(in_string)
            return Request.build_from_splunkd_request(args)
        except Exception as e:
            logger.error('Failed to build request object - error: %s' % e)
            raise BaseRestException(http.client.BAD_REQUEST, _('Bad Request'))

    def _response(self, status, payload):
        if status not in HTTP_STATUS_CODES:
            logger.error('Invalid status code %s - payload: %s' % (status, payload))
            return self._response_error(http.client.INTERNAL_SERVER_ERROR, _('Internal Server Error'))
        if status >= 400:
            if not isinstance(payload, basestring):
                logger.error('Invalid error message type %s as payload, must be basestring' % type(payload))
                return self._response_error(http.client.INTERNAL_SERVER_ERROR, _('Internal Server Error'))
            return self._response_error(status, payload)
        else:
            return {
                'status': status,
                'payload': payload
            }

    def _response_error(self, status, message):
        return {
            'status': status,
            'payload': {
                'message': message
            }
        }
