[symantec_ep_proxy]
proxy_enabled = [ 1 | 0 ]
* Indicates whether the use of proxy is enabled or disabled.
* Defaults is 0 (false).

proxy_url = <host>
* REQUIRED
* Sets the hostname of the proxy server.

proxy_port = <port number>
* REQUIRED
* Port used with proxy url.

proxy_username = <string>
* User name for proxy account.

proxy_password = <string>
* Password for proxy account.

proxy_type = [ http | http_no_tunnel | socks4 | socks5 ]
* Indicates type of proxy to be used.
* Default is http.

proxy_rdns = [ 1 | 0 ]
* Indicates whether to use proxy to do DNS resolution.
* Default is 0 (false).