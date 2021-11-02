# Splunk REST API Modular Input v1.8.7

## Overview

This is a Splunk modular input add-on for polling REST APIs.

## Activation Key

You require an activation key to use this App. Visit http://www.baboonbones.com/#activation to obtain a non-expiring key


## Features

* Perform HTTP(s) GET/POST/PUT/HEAD requests to REST endpoints and output the responses to Splunk
* Multiple authentication mechanisms
* Add custom HTTP(s) Header properties
* Add custom URL arguments
* HTTP(s) Streaming Requests
* HTTP(s) Proxy support , supports HTTP CONNECT Verb
* Response regex patterns to filter out responses
* Configurable polling interval
* Configurable timeouts
* Configurable indexing of error codes
* Persist and retrieve cookies

## Authentication

The following authentication mechanisms are supported:

* None
* HTTP Basic
* HTTP Digest
* OAuth1
* OAuth2 (with auto refresh of the access token)
* Custom

## Dependencies

* Splunk 5.0+
* Supported on Windows, Linux, MacOS, Solaris, FreeBSD, HP-UX, AIX

## Setup

* Untar the release to your $SPLUNK_HOME/etc/apps directory
* Restart Splunk
* If you are using a Splunk UI Browse to `Settings -> Data Inputs -> REST` to add a new Input stanza via the UI
* If you are not using a Splunk UI (ie: you are running on a Universal Forwarder) , you need to add a stanza to inputs.conf directly as per the specification in `README/inputs.conf.spec`. The `inputs.conf` file should be placed in a `local` directory under an App or User context.

## Custom Authentication Handlers

You can provide your own custom Authentication Handler. This is a Python class that you should add to the rest_ta/bin/authhandlers.py module.

http://docs.python-requests.org/en/latest/user/advanced/#custom-authentication

You can then declare this class name and any parameters in the REST Input setup page.

## Custom Response Handlers

You can provide your own custom Response Handler. This is a Python class that you should add to the rest_ta/bin/responsehandlers.py module.

You can then declare this class name and any parameters in the REST Input setup page.


## Encryption of credentials

If you require an encrypted credential in your configuration , then you can enter it on the `rest_ta` setup page.

Browse to `Apps -> Manage Apps -> rest_ta -> Setup`

Then in your configration stanza refer to it in the format `{encrypted:somekey}`

Where `somekey` is any value you choose to enter on the setup page to refer to your credential.

### EXAMPLES

* endpoint = http://foo.com/{encrypted:somekey}
* http_header_propertys = authkey={encrypted:somekey}
* url_args = mysecret={encrypted:somekey} 


## Token substitution in Endpoint URL

There is support for dynamic token substitution in the endpoint URL

ie : /someurl/foo/$sometoken$/goo 

$sometoken$ will get substituted with the output of the 'sometoken' function in bin/tokens.py

So you can add you own tokens simply by adding a function to bin/tokens.py

Currenty there is 1 token implemented , $datetoday$ , which will resolve to today's date in format "2014-02-18"

Token replacement functions in the URL can also return a list of values, that will cause 
multiple URL's to be formed and the requests for these URL's will be executed in parallel in multiple threads. 

## Certificate Verification

By default, certificate verification is disabled.

If you wish to enable certificate verification then you can provide the path to a CA Bundle file when setting up your REST stanza.

More info on the CA Bundle File here , https://requests.readthedocs.io/en/master/user/advanced/#ssl-cert-verification


## Logging

Any log entries/errors will get written to $SPLUNK_HOME/var/log/splunk/splunkd.log

These are also searchable in Splunk : `index=_internal error rest.py`


## Troubleshooting

* You are using Splunk 5+
* Look for any errors in $SPLUNK_HOME/var/log/splunk/splunkd.log
* Any firewalls blocking outgoing HTTP calls
* Is your REST URL, headers, url arguments correct
* Is you authentication setup correctly

## Support

[BaboonBones.com](http://www.baboonbones.com#support) offer commercial support for implementing and any questions pertaining to this App.
