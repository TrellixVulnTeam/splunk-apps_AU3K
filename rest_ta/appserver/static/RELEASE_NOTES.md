1.8.7
-----
* added code to prevent passwords from other apps that might have their sharing set to Global from being concatenated into the rest_ta namespace.

1.8.6
-----
* minor fix to encryption logic

1.8.5
-----
* improved the usability of the setup page for encrypting credentials

1.8.4
-----
* can now pass oauth2 session through to a custom response handler
* added config field for oauth2 expires_in
* added a custom setup page if you require encryption of credentials

1.8.3
-----
* bundled in python modules that are not packaged into Splunk versions pre 8 : urlib3 , certifi , chardet , idna

1.8.2
-----
* updated the bundled version of the requests library to version 2.23.0
* stateful variables/settings used to get persisted back to inputs.conf , now they get persisted to a custom config file reststate.conf , which should solve any unwanted auto restarting of the app by splunkd.
* made error logging more verbose by adding stanza name
* minor tweak to authhandlers.py for python 2/3 dual compatibility

1.8.1
-----
* no changes , changes for this build got pushed up to 1.8.2

1.8
-----
* Python 2.7 and 3+ compatibility

1.7
-----
* added support for Certificate verification using a supplied CA Bundle file

1.6
-----
* fixed Splunk 8 compatibility for manager.xml file

1.5.7
-----
* added client certificate config options

1.5.6
-----
* updated docs

1.5.5
-----
* added trial key functionality

1.5.4
-----
* added a triggers stanza to app.conf to prevent reloading after saving state back to inputs.conf

1.5.3
-----
* patched a bug to callbacks to Splunk for persisting state that required the activation key in the payload

1.5.2
-----
* minor manager xml ui tweak for 7.1

1.5.1
-----
* Corrected a build bug with responsehandlers

1.5
-----
* Added an activation key requirement , visit http://www.baboonbones.com/#activation to obtain a non-expiring key
* Added support for HEAD requests
* Docs updated
* Splunk 7.1 compatible

1.4
----
* Delimiter fix

1.3.9
-----
* Can now declare a CRON pattern for your polling interval.
* Multiple requests spawned by tokenization can be declared to run in parallel or sequentially.
* Multiple sequential requests can optionally have a stagger time enforced between each request.

1.3.8
-----
* Minor code bug with logging

1.3.7
-----
* Added support for token replacement functions in the URL to be able to return a list
of values, that will cause multiple URL's to be formed and the requests for these
URL's will be executed in parallel in multiple threads. See tokens.py

1.3.6
-----

* Added a custom response handler for rolling out generic JSON arrays
* Refactored key=value delimited string handling to only split on the first "=" delimiter

1.3.5
-----

* Ensure that token substitution in the endpoint URL is dynamically applied for each
HTTP request

1.3.4
-----

* Added support for dynamic token substitution in the endpoint URL  
  
ie : /someurl/foo/$sometoken$/goo  
  
$sometoken$ will get substituted with the output of the 'sometoken' function
in bin/tokens.py  

1.3.3
-----
* Added support to persist and retrieve cookies

1.3.2
-----
* Changed the logic for persistence of state back to inputs.conf to occur directly after polling/event indexing has completed rather than waiting for the polling loop frequency sleep period to exit. This potentially deals with situations where you might terminate Splunk before the REST Mod Input has persisted state changes back to inputs.conf because it was in a sleep loop during shutdown.