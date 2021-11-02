"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
Module for processing UDF HostedResource requests
"""
from splunk import getWebServerInfo
from cloudgateway.private.encryption.encryption_handler import sign_detached
from http import HTTPStatus
from spacebridge_protocol import http_pb2
from spacebridgeapp.udf.udf_util import parse_hosted_resource_path, HostedResourceType, \
    build_encrypted_resource, get_collection_from_resource_type, parse_udf_kvstore_resource
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.messages.util import fetch_device_info
from spacebridgeapp.request.request_processor import SpacebridgeAuthHeader

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_udf_request_processor.log", "udf_request_processor")


async def fetch_kvstore_resource(request_context,
                                 resource_key,
                                 resource_type,
                                 async_kvstore_client=None):
    """
    Fetch kvstore resource given resource_key
    :param request_context:
    :param resource_key:
    :param resource_type:
    :param async_kvstore_client:
    :return:
    """
    collection = get_collection_from_resource_type(resource_type)

    r = await async_kvstore_client.async_kvstore_get_request(collection=collection,
                                                             auth_header=request_context.system_auth_header,
                                                             key_id=resource_key,
                                                             app=constants.SPLUNK_DASHBOARD_STUDIO)

    # To support backwards compatibility with old splunk-dashboard-app we will try that namespace if 404 is returned
    if r.code == HTTPStatus.NOT_FOUND:
        r = await async_kvstore_client.async_kvstore_get_request(collection=collection,
                                                                 auth_header=request_context.system_auth_header,
                                                                 key_id=resource_key,
                                                                 app=constants.SPLUNK_DASHBOARD_APP)
    if r.code != HTTPStatus.OK:
        response = await r.text()
        raise SpacebridgeApiRequestError(
            f"Exception fetching resource from KV Store with error_code={r.code}, error_msg={response}",
            status_code=r.code)

    response_json = await r.json()

    return parse_udf_kvstore_resource(response_json, request_context)


async def fetch_local_resource(request_context, resource_uri, async_client):
    """
    Fetch the bytes of a local image resource_uri
    :param request_context:
    :param resource_uri:
    :param async_client:
    :return:
    """
    web_hostname = getWebServerInfo()
    uri = f'{web_hostname}{resource_uri}'
    response = await async_client.async_get_request(uri=uri, auth_header=request_context.auth_header)

    if response.code != HTTPStatus.OK:
        response_text = await response.text()
        raise SpacebridgeApiRequestError(
            f"Exception fetching local resource with error_code={response.code}, error_msg={response_text}",
            status_code=response.code)

    # Get image content-type
    content_type = response.headers['content-type']

    # When getting the response through the SDK we need to get the raw bytes directly from the response using _body
    # Since read() is not idempotent we aren't able to call it due to it already being called in Spacebridge SDK
    return content_type, response._body


async def fetch_encrypted_resource_url(request_context, mime, resource_bytes, encryption_context,
                                       async_kvstore_client=None, async_spacebridge_client=None):
    """
    Encrypt and store the resource_bytes in Spacebridge asset storage and return the encrypted resource url
    :param request_context:
    :param mime:
    :param resource_bytes:
    :param encryption_context:
    :param async_kvstore_client:
    :param async_spacebridge_client:
    :return:
    """
    # Fetch device_info to get public key
    device_info = await fetch_device_info(device_id=request_context.raw_device_id,
                                          async_kvstore_client=async_kvstore_client,
                                          system_auth_header=request_context.system_auth_header)

    payload = build_encrypted_resource(resource_bytes=resource_bytes,
                                       device_encrypt_public_key=device_info.encrypt_public_key,
                                       encryption_context=encryption_context)

    signature = sign_detached(encryption_context.sodium_client, encryption_context.sign_private_key(), payload)
    sender_id = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)

    r = await async_spacebridge_client.async_send_storage_request(payload=payload,
                                                                  content_type=mime,
                                                                  signature=signature,
                                                                  auth_header=SpacebridgeAuthHeader(sender_id),
                                                                  request_id=request_context.request_id)

    if r.code != HTTPStatus.OK:
        response = await r.text()
        raise SpacebridgeApiRequestError(
            f"Exception storing resource to Spacebridge with code={r.code}, error_msg={response}",
            status_code=r.code)

    # When getting the response through the SDK we need to get the raw bytes directly from the response using _body
    # Since read() is not idempotent we aren't able to call it due to it already being called in Spacebridge SDK
    storage_response = http_pb2.StorageResponse()
    storage_response.ParseFromString(r._body)

    return storage_response.payload.readUri


async def process_udf_hosted_resource_get(request_context,
                                          client_single_request,
                                          server_single_response,
                                          async_kvstore_client=None,
                                          async_spacebridge_client=None,
                                          encryption_context=None):
    """
    Process a UDF hosted resource get request. This used for fetching assets which are used within UDF dashboards
    such as images.
    :param request_context:
    :param client_single_request:
    :param server_single_response:
    :param async_kvstore_client:
    :param async_spacebridge_client:
    :param encryption_context:
    """
    resource_path = client_single_request.udfHostedResourceRequest.resourceUrl
    resource_type = client_single_request.udfHostedResourceRequest.resourceType
    hosted_resource_type, parsed_path = parse_hosted_resource_path(resource_path)

    if hosted_resource_type == HostedResourceType.KVSTORE:
        mime, resource_bytes = await fetch_kvstore_resource(request_context=request_context,
                                                            resource_key=parsed_path,
                                                            resource_type=resource_type,
                                                            async_kvstore_client=async_kvstore_client)

        resource_url = await fetch_encrypted_resource_url(request_context=request_context,
                                                          mime=mime, resource_bytes=resource_bytes,
                                                          encryption_context=encryption_context,
                                                          async_kvstore_client=async_kvstore_client,
                                                          async_spacebridge_client=async_spacebridge_client)

        server_single_response.udfHostedResourceResponse.encryptedResourceUrl = resource_url
    elif hosted_resource_type == HostedResourceType.LOCAL:
        # Just need to pass in any AsyncNonSslClient
        mime, resource_bytes = await fetch_local_resource(request_context=request_context,
                                                          resource_uri=parsed_path,
                                                          async_client=async_kvstore_client)

        resource_url = await fetch_encrypted_resource_url(request_context=request_context,
                                                          mime=mime, resource_bytes=resource_bytes,
                                                          encryption_context=encryption_context,
                                                          async_kvstore_client=async_kvstore_client,
                                                          async_spacebridge_client=async_spacebridge_client)

        server_single_response.udfHostedResourceResponse.encryptedResourceUrl = resource_url
    elif hosted_resource_type == HostedResourceType.URL:
        raise SpacebridgeApiRequestError("Fetching URLs resource from Spacebridge is not currently supported",
                                         status_code=HTTPStatus.METHOD_NOT_ALLOWED)
    else:
        raise SpacebridgeApiRequestError("Exception fetching hosted resource, unknown resource type",
                                         status_code=HTTPStatus.BAD_REQUEST)
