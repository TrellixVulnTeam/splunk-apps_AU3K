import os
import re
import sys
import copy
import json
import time
import splunk.rest as sr
from itertools import groupby

if sys.version_info.major == 2:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py2', 'pura_libs_utils'))
elif sys.version_info.major == 3:
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3'))
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'libs_py3', 'pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager
from pura_libs_utils.pura_consts import *
from pura_libs_utils import pura_utils as utils
from pura_libs_utils import six
from builtins import str
from builtins import range
from builtins import object
from splunk.clilib import cli_common as cli
import os
import sys
import re

logging = logger_manager.setup_logging('pura_telemetry')

class Telemetry(object):
    """
    This class deals with collecting telemetry data and sending to Splunk via REST call
    """

    def __init__(self, session_key, request_body, host, user):

        self.session_key = session_key
        self.request_body = request_body
        self.telemetry_data = dict()
        self.host = host
        self.user = user

    def init_telemetry(self):
        """
        Set telemetry entry for a scan if applicable
        """

        TELEMETRY_DATA = {
            'type': "event",
            'component': "app.pythonupgradereadiness.scan",
            'optInRequired': 2,
            'data': {
                'appVersion': "1.0.0",
                'scanType': TELEMETRY_ALL,
                'scanTypeModified': True
            }
        }

        self.telemetry_data['statistics'] = TELEMETRY_DATA
        schedule_last_update, schedule_details =  self.get_scan_frequency_data()
        SUMMARY_DATA = {
            'appListDate': self.get_app_list_date(),
            'skippedAppsNumber': 0,
            'scanFrequency': schedule_details,
            'frequencyUpdateTime': schedule_last_update,
            'stackDefaultPython': self.get_default_python_stack()
        }
        ERROR_INFO = {
            'status': '',
            'errorMessage': ''
        }
        self.telemetry_data['summary'] = SUMMARY_DATA
        self.telemetry_data['errors'] = ERROR_INFO


    def get_app_list_date(self):
        max_epoch_time = None
        if os.path.exists(SYNCED_CSV_PATH):
            for new_csv in os.listdir(SYNCED_CSV_PATH):
                # if at all multiple files are present then get the file with greatest epoch
                epoch_time = int(new_csv.split("_")[1][:-4])
                if max_epoch_time is None or epoch_time > max_epoch_time:
                    max_epoch_time = epoch_time
            return str(max_epoch_time)
        return "NA"

    def get_scan_frequency_data(self):
        response = None
        content = None
        try:
            response, content = sr.simpleRequest("{}?output_mode=json".format(schedule_scan_endpoint),
                                                 sessionKey=self.session_key,)
        except Exception:
            logging.exception(MESSAGE_EXCEPTION_READ_SCHEDULE_SCAN_DETAILS.format(self.user, self.host))
            return None
        if response["status"] not in success_codes:
            logging.error(MESSAGE_ERROR_READ_SCHEDULE_SCAN_DETAILS.format(self.user, self.host))
            return None
        schedule_scan_details = dict()
        max_timestamp = None
        logging.info('schedule_scan_endpoint value {} '.format(content))
        for schedule_scan_detail in json.loads(content):
            logging.info(
                'self.host : {}, schedule_scan_detail["host"] : {}'.format(self.host, schedule_scan_detail['host']))
            if self.host == schedule_scan_detail["host"] and max_timestamp is None or max_timestamp < int(schedule_scan_detail["timestamp"]):
                max_timestamp = int(schedule_scan_detail["timestamp"])
                schedule_scan_details = schedule_scan_detail
        logging.info('schedule_scan_details values {} '.format(schedule_scan_details))
        if len(schedule_scan_details.keys()) > 0:
            schedule_scan_details.pop('host')
            schedule_scan_details.pop('schedule_scan_type')
            schedule_scan_details.pop('timestamp')
            schedule_scan_details.pop('_key')
            try:
                schedule_scan_details.pop('_user')
                schedule_scan_details.pop('user')
            except:
                logging.info("No username found.")
        return str(max_timestamp), schedule_scan_details

    def get_default_python_stack(self):
        try:
            version = cli.getConfKeyValue('server', 'general', 'python.version')
            return version
        except Exception:
            return 'Error fetching the Python stack version'
        return None

    def update_telemetry_data(self, report, result, app, app_meta, skip_flag, default):
        """
        Update telemetry data as per the processed report of the app

        :param report: App report
        :param result: Status of the app
        :param app: Name and label of the app
        :param app_meta: Type of app and external link of app
        :param default: Boolean value signifying app is set to PASSED by default

        :return None
        """


        if skip_flag:
            self.telemetry_data['summary']['skippedAppsNumber'] += 1
        app_name = app[1]
        try:
            app_version = report['version']
        except:
            app_version = ''
            logging.info("Missing version key.")

        if default:
            meta_data = dict()
            meta_data['source'] = "Splunkbase"
            meta_data['appStatus'] = result
            meta_data['MakoXMLStatus'] = CHECK_CONST_PASSED
            meta_data['MakoNumber'] = 0
            meta_data['PythonScriptStatus'] = CHECK_CONST_PASSED
            meta_data['PythonScriptNumber'] = 0
            meta_data['skipped'] = skip_flag
            meta_data['dismissedApp'] = report['summary']['dismiss_app']
            meta_data['dismissedAppDate'] = report['summary']['dismiss_app_date']

        else:
            meta_data = dict()
            app_name = ''
            if app_meta[0] == CONST_PRIVATE:
                meta_data['source'] = "Private"
                app_name = 'XXXXXXXXXXX'
                app_version = 'XXXXXXXXXXX'
            else:
                meta_data['source'] = "Splunkbase"
                app_name = app[1]
            meta_data['appStatus'] = result
            meta_data['skipped'] = skip_flag
            meta_data['dismissedApp'] = report['summary']['dismiss_app']
            meta_data['dismissedAppDate'] = report['summary']['dismiss_app_date']

            for check in report['checks']:
                if check['name'] == "Python in custom Mako templates":
                    meta_data['MakoXMLStatus'] = check['result']
                    file_list = list(entry for entry in check['messages'] if entry['message_filename'] is not None)
                    meta_data['MakoNumber'] = len(file_list)
                elif check['name'] == "Python scripts":
                    meta_data['PythonScriptStatus'] = check['result']
                    meta_data['PythonScriptNumber'] = len(check['messages'])

        meta_data['pythonSDKVersion'] = self.getPytonSDKVersion(report['app_path'])
        self.telemetry_data['apps'].append({
            'name': app_name,
            'version': app_version,
            'status': report['summary']['Status'],
            'details': report['details'],
            'type': report['summary']['type'],
            'meta': meta_data
        })

    def send_telemetry(self):
        """
        Send data statistics to telemetry endpoint
        """

        counter = 0
        more_data = True
        while more_data:
            data, more_data = self.chunk_data(counter)
            if not data:
                break
            try:
                response, _ = sr.simpleRequest('{}?output_mode=json'.format(telemetry_endpoint),
                                               sessionKey=self.session_key,
                                               jsonargs=json.dumps(data),
                                               method='POST',
                                               raiseAllErrors=True)
                if response['status'] not in success_codes:
                    logging.error("Error Code: {}".format(str(response['status'])))
                else:
                    logging.info("Telemetry data uploaded on : {}".format(str(time.asctime())))

            except Exception as e:
                logging.exception(str(e))
                break
            counter += 20
            if not more_data:
                break

    def chunk_data(self, counter):
        """
        Divide total data statisitcs in chunks of 1 apps for telemetry

        :param counter: Counter from where the app data should be chunked

        :return chunk, more_data: JSON data of 1 apps, True/False
        """

        apps = self.telemetry_data['apps']
        if counter >= len(apps):
            return {}, False

        chunk = copy.deepcopy(self.telemetry_data['statistics'])
        chunk['data']['summary'] = self.telemetry_data['summary']
        chunk['data']['errors'] = self.telemetry_data['errors']

        last_item = counter + 20
        more_data = True
        if last_item > len(apps):
            last_item = len(apps)
            more_data = False
        chunk['data']['apps'] = apps[counter:last_item]

        return chunk, more_data

    def get_init_files(self, app_name):
        init_files = []
        for dirpath, dirs, files in os.walk(app_name):
            for filename in files:
                fname = os.path.join(dirpath, filename)
                if fname.endswith('/splunklib/__init__.py') or fname.endswith('\splunklib\__init__.py') or fname.endswith('\\splunklib\\__init__.py'):
                    init_files.append(fname)
        return init_files

    def read_version(self, file_path):
        with open(file_path) as f:
            content = f.readlines()
        content = [x.strip() for x in content]
        matcher_rex = re.compile(r'^(\s*[A-Za-z_][A-Za-z_0-9]*\s*)(?=\=)(?!==)(\s*.*)')
        for line in content:
            matches = matcher_rex.search(line)
            if matches:
                name, value = matches.groups()
                if name == "__version_info__ " or name == "__version__ ":
                    version_rex = re.compile(r'\s*((\d*)(\s*)(\.|\,)(\s*)(\d*)(\s*)(\.|\,)(\s*)(\d*))\s*')
                    version_matches = version_rex.search(value)
                    if version_matches:
                        version = version_matches.groups()[0]
                        version = version.replace(',', '.').replace(' ', '')
                        return version
        return None

    def getPytonSDKVersion(self, app_path):
        init_files = self.get_init_files(app_path)
        versions = set()
        try:
            for path in init_files:
                version = self.read_version(path)
                if version:
                    versions.add(version)
            versions = ", ".join(versions)
            return versions
        except Exception as e:
            logging.exception("Exception getting the Python SDK version for app {} ".format(app_path))
        return ""
