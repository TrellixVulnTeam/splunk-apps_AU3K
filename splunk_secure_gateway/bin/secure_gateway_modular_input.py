"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Modular input for the Spacebridge app which brings up
a web socket server to talk to Spacebridge
"""


# Suppress warnings to pass AppInspect when calling --scheme
import warnings
import logging
import asyncio
import os

from spacebridgeapp.util import py23
from spacebridgeapp.util.mtls import build_mtls_spacebridge_client, build_key_bundle

py23.suppress_insecure_https_warnings()
warnings.filterwarnings('ignore', '.*service_identity.*', UserWarning)

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

from cloudgateway.websocket import CloudGatewayWsClient, WebsocketMode, AbstractWebsocketContext
from cloudgateway.private.sodium_client.sharedlib_sodium_client import SodiumClient
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.rest.opt_in.opt_in_handler import get_opt_in, DEFAULT_OPT_IN, USER, TIMESTAMP
from spacebridgeapp.util.shard import default_shard_id
from spacebridgeapp.util.base_modular_input import BaseModularInput
from spacebridgeapp.access.access_control import allow_access
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.messages.message_handler import CloudgatewayMessageHandler
from spacebridgeapp.util import constants
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.rest.config.deployment_info import ensure_deployment_friendly_name
from spacebridgeapp.rest.load_balancer_verification import get_uri
from cloudgateway.splunk.asyncio.auth import SplunkAuthHeader


async def _periodic_flush(websocket, subscription_client, auth_header, logger):
    time_lapsed_seconds = 0
    while not websocket.closed:
        if time_lapsed_seconds >= 30:
            logger.debug("flush starting")
            await subscription_client.flush(auth_header)
            logger.debug("flush complete")
            logger.debug("flush sleep")
            time_lapsed_seconds = 0
        await asyncio.sleep(1)
        time_lapsed_seconds += 1


class SpacebridgeModularInput(BaseModularInput):
    """ Main entry path for launching the Spacebridge Application
    Modular Input
    Arguments:
        modular_input {[type]} -- [description]
    """
    title = 'Splunk Secure Gateway'
    description = 'Initializes the Splunk Secure Gateway application to talk to mobile clients over websockets'
    app = 'Splunk Secure Gateway'
    name = 'splunksecuregateway'
    use_kvstore_checkpointer = False
    use_hec_event_writer = False
    logger = setup_logging(constants.SPACEBRIDGE_APP_NAME + '_modular_input.log', 'secure_gateway_modular_input.app')

    def extra_arguments(self):
        """
        Override extra_arguments list for modular_input scheme
        :return:
        """
        return [
            {
                'name': 'param1',
                'description': 'No params required'
            }
        ]

    def do_run(self, input_config):
        """ Spins up a websocket connection Spacebridge and begins
        the reactor loops
        """
        if not super(SpacebridgeModularInput, self).do_run(input_config):
            return

        # Determine if we should allow_access to Spacebridge based on env and opt_in
        if not allow_access(self.session_key):
            self.logger.debug('Acknowledgement of Spacebridge non-compliance is pending.  Modular Input will NOT run.')
            return

        # Log opt-in response on startup
        opt_in = get_opt_in(DEFAULT_OPT_IN, self.session_key)
        if opt_in:
            self.logger.info(f'Spacebridge non-compliance was acknowledged by '
                             f'user={opt_in[USER]}, timestamp={opt_in[TIMESTAMP]}.  Modular Input is running.')

        shard_id = default_shard_id()

        self.logger.info("Starting libsodium child process")
        sodium_logger = self.logger.getChild('sodium_client')
        sodium_logger.setLevel(logging.WARN)

        sodium_client = SodiumClient(sodium_logger)
        encryption_context = SplunkEncryptionContext(self.session_key,
                                                     constants.SPACEBRIDGE_APP_NAME,
                                                     sodium_client)

        self.logger.info("Running Splunk Secure Gateway modular input on search head, shard_id=%s", shard_id)

        # Fetch load balancer address if configured, otherwise use default URI
        try:
            uri = get_uri(self.session_key)
            self.logger.debug("Successfully verified load_balancer_address={}".format(uri))
        except Exception as e:
            self.logger.exception("Failed to verify load_balancer_address. {}".format(e))

        if not uri:
            return

        try:
            spacebridge_client = None
            key_bundle = None
            if config.get_mtls_enabled():
                key_bundle = build_key_bundle(self.session_key)
                spacebridge_client = build_mtls_spacebridge_client(self.session_key)

            ensure_deployment_friendly_name(self.session_key)
            async_client_factory = AsyncClientFactory(uri, spacebridge_client=spacebridge_client)

            subscription_client = async_client_factory.subscription_client()

            auth_header = SplunkAuthHeader(self.session_key)

            cloudgateway_message_handler = CloudgatewayMessageHandler(SplunkAuthHeader(self.session_key),
                                                                      logger=self.logger,
                                                                      encryption_context=encryption_context,
                                                                      async_client_factory=async_client_factory,
                                                                      shard_id=shard_id)

            client = CloudGatewayWsClient(encryption_context, message_handler=cloudgateway_message_handler,
                                          mode=WebsocketMode.ASYNC,
                                          logger=self.logger,
                                          config=config,
                                          shard_id=shard_id,
                                          key_bundle=key_bundle,
                                          websocket_context=WebsocketContext(subscription_client, auth_header,
                                                                             self.logger))

            client.connect()
        except Exception as e:
            self.logger.exception("Exception connecting to spacebridge={0}".format(e))


class WebsocketContext(AbstractWebsocketContext):
    def __init__(self, subscription_client, auth_header, logger):
        self.RETRY_INTERVAL_SECONDS = 2
        self.subscription_client = subscription_client
        self.auth_header = auth_header
        self.logger = logger

    async def on_open(self, protocol):
        self.logger.info("Creating flush task")
        asyncio.create_task(_periodic_flush(protocol, self.subscription_client, self.auth_header, self.logger))

    async def on_ping(self, payload, protocol):
        pass

    async def on_pong(self, payload, protocol):
        pass

    async def on_close(self, wasClean, code, reason, protocol):
        pass


if __name__ == "__main__":
    worker = SpacebridgeModularInput()
    worker.execute()
