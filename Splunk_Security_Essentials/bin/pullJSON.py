import os
import sys
import json 
import random
import json, csv, re, os
import urllib, urllib2
import sys
import splunk.entity, splunk.Intersplunk
from splunk.clilib.cli_common import getConfKeyValue

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)

from splunk.persistconn.application import PersistentServerConnectionApplication


class pullJSON(PersistentServerConnectionApplication):
    def __init__(self, command_line, command_arg):
        PersistentServerConnectionApplication.__init__(self)

    def handle(self, in_string):
        input = {}
        payload = {}
        app = "Splunk_Security_Essentials"
        valid_config_files = {  "usecases": "/components/localization/usecases", "data_inventory": "/components/localization/data_inventory",  "htmlpanels": "/components/localization/htmlpanels", "config": "/components/data/system_config"}
        desired_config = ""
        valid_locales = ["ja-JP", "en-DEBUG"]
        desired_locale = ""
        try: 
            input = json.loads(in_string)
            sessionKey = input['session']['authtoken']
            owner = input['session']['user']
            if "query" in input:
                for pair in input['query']:
                    if pair[0] == "app":
                        app = pair[1]
                    elif pair[0] == "config":
                        if pair[1] in valid_config_files:
                            desired_config = pair[1]
                    elif pair[0] == "locale":
                        if pair[1] in valid_locales:
                            desired_locale = "." + pair[1]
        except:
            return {'payload': json.dumps({"response": "Error! Couldn't find any initial input. This shouldn't happen."}),  
                    'status': 500          # HTTP status code
            }

        if desired_config=="":
            return {'payload': json.dumps({"response": "Error! No valid configuration specified. Should be passed with ?config=config (to grab the config object)."}),  
                    'status': 500          # HTTP status code
            }
        
        try:
            # Now to grab files off the filesystem
            path = os.environ['SPLUNK_HOME'] + "/etc/apps/" + app + "/appserver/static" + valid_config_files[desired_config] + desired_locale + ".json"
            if desired_locale != "":
                if not os.path.exists(path):
                    path = os.environ['SPLUNK_HOME'] + "/etc/apps/" + app + "/appserver/static" + valid_config_files[desired_config] + ".json"
            with open(path) as f:
                data = json.load(f)
                return {'payload': data,  
                        'status': 200
                }
        except: 
            return {'payload': {},  
                    'status': 404
            }

        return {'payload': {},  
                'status': 404
        }
        
