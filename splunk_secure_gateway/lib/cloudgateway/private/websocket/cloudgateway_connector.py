import sys

if sys.version_info < (3,0):
    from OpenSSL import SSL
    from twisted.internet import ssl
    from twisted.internet.ssl import PrivateCertificate
    from autobahn.twisted.websocket import connectWS
    from twisted.internet import reactor
    from cloudgateway.private.twisted.websocket import cloudgateway_client_protocol
    from cloudgateway.private.twisted.auth_header import SplunkAuthHeader
    from cloudgateway.private.twisted.websocket.cloudgateway_message_handler import CloudgatewayMessageHandler
else:
    from cloudgateway.key_bundle import asyncio_ssl_context
    from contextlib import suppress
    import asyncio
    from cloudgateway.private.util.splunk_auth_header import SplunkAuthHeader
    from cloudgateway.private.asyncio.websocket.aio_message_handler import AioMessageHandler
    from cloudgateway.private.asyncio.websocket.cloudgateway_init import send_public_key_to_spacebridge
    from cloudgateway.private.asyncio.websocket.aiohttp_wss_protocol import AiohttpWssProtocol
    import types


from cloudgateway.private.registration.util import sb_auth_header
from cloudgateway.private.util import constants
from threading import Thread


def _run_asyncio_loop(aiohttp_wss_protocol, logger, key_bundle, retry_interval):
    try:
        with asyncio_ssl_context(key_bundle) as ctx:
            asyncio.run(aiohttp_wss_protocol.connect(ctx))

    except Exception as e:
        logger.exception("Could not establish connection with error={}, retrying in {} seconds..."
                         .format(e, retry_interval))


class CloudgatewayConnector(object):
    """
    Abstract class used to initiate a connection to cloudgateway via websocket. This is abstract because there are
    different methods by which we may want to connect to Cloudgateway.
    """

    DEFAULT_RETRY_INTERVAL_SECONDS = 2

    def __init__(self,
                 message_handler,
                 encryption_context,
                 system_session_key,
                 parent_process_monitor,
                 cluster_monitor,
                 logger,
                 config,
                 max_reconnect_delay=60,
                 mode=constants.THREADED_MODE,
                 shard_id=None,
                 websocket_context=None,
                 key_bundle=None
                 ):
        """
        Args:
            message_handler: IMessageHandler interface for delegating messages
            encryption_context: EncryptionContext object
            system_session_key: SplunkAuthHeader
            parent_process_monitor: ParentProcessMonitor
            logger: Logger object for logging purposes
            max_reconnect_delay: optional parameter to specify how long to wait before attempting to reconnect
        """
        self.message_handler = message_handler
        self.encryption_context = encryption_context
        self.system_session_key = system_session_key
        self.parent_process_monitor = parent_process_monitor
        self.cluster_monitor = cluster_monitor
        self.logger = logger
        self.max_reconnect_delay = max_reconnect_delay
        self.mode = mode
        self.config = config
        self.shard_id = shard_id
        self.websocket_context = websocket_context
        self.key_bundle = key_bundle
        self.factory = self.build_client_factory()

        if parent_process_monitor:
            self.logger.info("parent pid {}".format(parent_process_monitor.parent_pid))

    def build_client_factory(self):
        """
        Setup a cloudgatewayclientfactory object before a connection is established to Cloudgateway. Configures
        things like the uri to connect on, auth headers, websocket protocol options, etc.

        Returns: CloudgatewayClientFactory object

        """

        headers = {'Authorization': sb_auth_header(self.encryption_context)}

        if self.shard_id:
            headers[constants.HEADER_SHARD_ID] = self.shard_id
            self.logger.info("Using shard_id={}".format(self.shard_id))

        ws_url = "wss://{0}/deployment".format(self.config.get_spacebridge_server())
        proxy, auth = self.config.get_ws_https_proxy_settings()

        if auth:
            headers['Proxy-Authorization'] = 'Basic ' + auth

        if sys.version_info < (3,0):
            factory = cloudgateway_client_protocol.CloudgatewayClientFactory(ws_url, headers=headers, proxy=proxy)
            factory.configure(cloudgateway_client_protocol.SpacebridgeWebsocketProtocol, self.max_reconnect_delay)
            factory.setProtocolOptions(autoFragmentSize=65536)
            factory.protocol.encryption_context = self.encryption_context
            factory.protocol.system_auth_header = SplunkAuthHeader(self.system_session_key)
            factory.protocol.parent_process_monitor = self.parent_process_monitor
            factory.protocol.logger = self.logger
            factory.protocol.mode = self.mode
            factory.protocol.cluster_monitor = self.cluster_monitor
            factory.protocol.websocket_context = self.websocket_context

        else:
            factory = types.SimpleNamespace()
            factory.proxy = proxy
            factory.auth = auth
            factory.ws_url = ws_url
            factory.headers = headers


        return factory


    def connect(self, threadpool_size=None):
        """
        Initiate a websocket connection to cloudgateway and kickoff the twisted reactor event loop.
        Returns:

        """

        if sys.version_info < (3,0):
            if threadpool_size and self.mode == constants.THREADED_MODE:
                reactor.suggestThreadPoolSize(threadpool_size)
            async_message_handler = CloudgatewayMessageHandler(self.message_handler,
                                                               self.encryption_context,
                                                               self.logger)

            self.factory.protocol.message_handler = async_message_handler

            ssl_context = ssl.optionsForClientTLS(u"{}".format(self.config.get_spacebridge_server()))

            connectWS(self.factory, contextFactory=ssl_context)

            if self.mode == constants.THREADED_MODE:
                Thread(target=reactor.run, args=(False,)).start()
            else:
                reactor.run()
        else:
            async_message_handler = AioMessageHandler(self.message_handler, self.encryption_context, self.logger)
            send_public_key_to_spacebridge(self.config, self.encryption_context, self.logger, self.key_bundle)
            proxy = 'http://{}:{}'.format(self.factory.proxy["host"], self.factory.proxy["port"]) if self.factory.proxy else None

            while True:
                # Dynamically check context for retry interval
                if self.websocket_context:
                    retry_interval = self.websocket_context.RETRY_INTERVAL_SECONDS
                else:
                    retry_interval = self.DEFAULT_RETRY_INTERVAL_SECONDS

                aiohttp_wss_protocol = AiohttpWssProtocol(self.factory.ws_url,
                                                          self.factory.headers,
                                                          proxy,
                                                          async_message_handler,
                                                          self.logger,
                                                          self.encryption_context,
                                                          self.websocket_context,
                                                          self.parent_process_monitor)

                _run_asyncio_loop(aiohttp_wss_protocol, self.logger, self.key_bundle, retry_interval)

                if retry_interval > 0:
                    asyncio.run(asyncio.sleep(retry_interval))
                else:
                    return

