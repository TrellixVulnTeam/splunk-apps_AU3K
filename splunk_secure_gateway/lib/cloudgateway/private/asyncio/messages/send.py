import aiohttp
from cloudgateway.private.messages.send import build_encrypted_payload

async def send_response(server_response, sender_encryption_info, websocket_protocol, logger):

    # Take server payload and wrap in an envelope
    try:

        signed_envelope = build_encrypted_payload(sender_encryption_info,
                                                  websocket_protocol.encryption_context,
                                                  server_response.payload,
                                                  server_response.request_id,
                                                  logger)

        serialized_envelope = signed_envelope.SerializeToString()

        logger.info("Signed Envelope size_bytes={0}, request_id={1}".format(signed_envelope.ByteSize(),
                                                                            server_response.request_id))

        await websocket_protocol.send_bytes(serialized_envelope)
        logger.info("message=SENT_BACK request_id={0}".format(server_response.request_id))
        return serialized_envelope

    except Exception as e:
        logger.exception("Error sending message back, request_id={0}".format(server_response.request_id))

