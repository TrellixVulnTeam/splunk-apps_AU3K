import os
import sys
import json 
import random
import json, csv, re, os
import urllib, urllib2
import sys


import splunk.entity, splunk.Intersplunk
from splunk.clilib.cli_common import getConfKeyValue, getConfStanza

if sys.platform == "win32":
    import msvcrt
    # Binary mode is required for persistent mode on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)

from splunk.persistconn.application import PersistentServerConnectionApplication

splunk_home = os.getenv('SPLUNK_HOME')
sys.path.append(splunk_home + '/etc/apps/Splunk_Security_Essentials/bin/')
sys.path.append(splunk_home + '/etc/apps/Splunk_Security_Essentials/bin/splunklib/')

import splunklib.client as client

class ShowcaseInfo(PersistentServerConnectionApplication):
    def __init__(self, command_line, command_arg):
        PersistentServerConnectionApplication.__init__(self)

    def handle(self, in_string):
        input = {}
        payload = {}
        sessionKey = ""
        owner = "" 
        app = "Splunk_Security_Essentials" 
        includeSSEFilter = True
        settings = dict()
        base_url =""
        bookmarks = dict()
        kvstore_usernames = dict()
        kvstore_conversion = dict()
        kvstore_data_status = dict()
        eventtypes_data_status = dict()
        eventtype_names = {}
        dsc_to_ds_name = {}
        eventtype_to_legacy_names = {}
        myApps = [app]
        globalSourceList = dict()
        debug = []
        globalSearchList = dict()
        mitre_names = {}
        mitre_refs_to_names = {}
        mitre_refs_to_refs = {}
        mitre_techniques_to_groups = {}
        desired_locale = ""
        valid_locales = ["ja-JP", "en-DEBUG"]
        bookmark_display_names = { "none": "Not On List", "bookmarked": "Bookmarked", "inQueue": "Ready for Deployment", "needData": "Waiting on Data", "issuesDeploying": "Deployment Issues", "needsTuning": "Needs Tuning", "successfullyImplemented": "Successfully Implemented" }
        throwErrorMessage = False
        try: 
            input = json.loads(in_string)
            sessionKey = input['session']['authtoken']
            owner = input['session']['user']
            if "query" in input:
                for pair in input['query']:
                    if pair[0] == "app":
                        app = pair[1]
                    elif pair[0] == "hideExcludedContent":
                        if pair[1] == "false":
                            includeSSEFilter = False
                    elif pair[0] == "locale":
                        if pair[1] in valid_locales:
                            desired_locale = "." + pair[1]
        except:
            return {'payload': json.dumps({"response": "Error! Couldn't find any initial input. This shouldn't happen."}),  
                    'status': 500          # HTTP status code
            }

        try: 
            service = client.connect(token=sessionKey)
            service.namespace['owner'] = 'nobody'
            service.namespace['app'] = 'Splunk_Security_Essentials'
        except Exception as e:
            debug.append(json.dumps({"status": "ERROR", "description": "Error grabbing a service object", "message": str(e)}))
            throwErrorMessage = True
        

        try:
            # Getting configurations
            base_url = "https://" + getConfKeyValue('web', 'settings', 'mgmtHostPort')
        except:
            return {'payload': json.dumps({"response": "Error getting configurations!"}),  
                    'status': 500          # HTTP status code
            }
            
        try:
            # Now to grab kvstore collection data
            kvstore_output = service.kvstore['bookmark'].data.query()
            for i in kvstore_output:
                bookmarks[i['_key']] = i

        except Exception as e:
            debug.append(json.dumps({"status": "ERROR", "description": "Error occurred while grabbing bookmark kvstore", "message": str(e)}))
            throwErrorMessage = True
        
        try:
            kvstore_output = service.kvstore['data_source_check'].data.query()
            for i in kvstore_output:
                if " - Demo" in i['searchName'] or ( i['showcaseId'] in kvstore_data_status and kvstore_data_status[ i['showcaseId'] ] == "Good" ):
                    continue
                kvstore_data_status[i['showcaseId']] = i['status']

        except Exception as e:
            debug.append(json.dumps({"status": "ERROR", "description": "Error occurred while grabbing data_source_check", "message": str(e)}))
            throwErrorMessage = True
        
        try:
            kvstore_output = service.kvstore['data_inventory_eventtypes'].data.query()
            for i in kvstore_output:
                eventtypes_data_status[i['eventtypeId']] = i['status']
        except Exception as e:
            debug.append(json.dumps({"status": "ERROR", "description": "Error occurred while grabbing data_inventory_eventtypes", "message": str(e)}))
            throwErrorMessage = True
        
            
        try:
            # Now to grab files off the filesystem
            for myApp in myApps:
                path = os.environ['SPLUNK_HOME'] + "/etc/apps/" + myApp + "/appserver/static/components/localization/ShowcaseInfo" + desired_locale + ".json"
                debug.append("desired_locale: " + desired_locale)
                if desired_locale != "":
                    if not os.path.exists(path):
                        path = os.environ['SPLUNK_HOME'] + "/etc/apps/" + myApp + "/appserver/static/components/localization/ShowcaseInfo.json"
                debug.append("path: " + path)
                with open(path) as f:
                    data = json.load(f)
                    if "summaries" not in globalSourceList:
                        globalSourceList = data
                        
                    else:
                        for summaryName in data['summaries']:
                            if summaryName not in globalSourceList['summaries']:
                                data['summaries'][summaryName]['channel'] = "Splunk_Security_Essentials"
                                data['summaries'][summaryName]['showcaseId'] = summaryName
                                globalSourceList['summaries'][summaryName] = data['summaries'][summaryName]
                                globalSourceList['roles']['default']['summaries'].append(summaryName)
        except Exception as e:
            return {'payload': json.dumps({"response": "Fatal Error grabbing ShowcaseInfo", "message": str(e)}),  
                    'status': 500
            }

        try:
            # Add a bookmark entry based on the showcaseId instead of just the summary name, to maintain 2.4.x compatibility
            bookmark_keys = bookmarks.keys()
            for bookmark in bookmark_keys:
                for summaryName in globalSourceList['summaries']:
                    if bookmarks[bookmark]['showcase_name'] == globalSourceList['summaries'][summaryName]['name']:
                        bookmarks[summaryName] = bookmarks[bookmark]
            debug.append(json.dumps(bookmarks))
        except Exception as e:
            debug.append(json.dumps({"status": "ERROR", "description": "Error while adding backwards compatibility for bookmark obj", "message": str(e)}))
            throwErrorMessage = True
        
        try:
            with open(os.environ['SPLUNK_HOME'] + "/etc/apps/" + app + "/appserver/static/components/localization/data_inventory.json") as f:
                data_inventory = json.load(f)
                for datasource in data_inventory:
                    eventtype_names[datasource] = data_inventory[datasource]['name']
                    for eventtype in data_inventory[datasource]['eventtypes']:
                        dsc_to_ds_name[eventtype] = data_inventory[datasource]['name'] 
                        eventtype_names[eventtype] = data_inventory[datasource]['eventtypes'][eventtype]['name']
                        if "legacy_name" in data_inventory[datasource]['eventtypes'][eventtype]:
                            eventtype_to_legacy_names[eventtype] = data_inventory[datasource]['eventtypes'][eventtype]["legacy_name"]
        except Exception as e:
            return {'payload': json.dumps({"response": "Fatal Error grabbing data_inventory.json", "message": str(e)}),  
                    'status': 500
            }


        try:
            myAssistants = ["showcase_first_seen_demo", "showcase_standard_deviation", "showcase_simple_search"]
            for assistant in myAssistants:
                with open(os.environ['SPLUNK_HOME'] + "/etc/apps/" + myApps[0] + "/appserver/static/components/data/sampleSearches/" + assistant + ".json") as f:
                    data = json.load(f)
                    globalSearchList.update(data)
        except Exception as e:
            return {'payload': json.dumps({"response": "Fatal Error grabbing showcase jsons", "message": str(e)}),  
                    'status': 500
            }


        try:
            with open(os.environ['SPLUNK_HOME'] + "/etc/apps/" + myApps[0] + "/appserver/static/vendor/mitre/enterprise-attack.json") as f:
                mitre_attack_blob = json.load(f)
                for obj in mitre_attack_blob['objects']:
                    if "type" in obj and obj['type'] == "relationship":
                        if "intrusion-set" in obj['source_ref'] and "attack-pattern" in obj['target_ref']:
                            if obj['target_ref'] not in mitre_refs_to_refs:
                                mitre_refs_to_refs[obj['target_ref']] = []
                            mitre_refs_to_refs[obj['target_ref']].append(obj['source_ref'])
                        if "intrusion-set" in obj['target_ref'] and "attack-pattern" in obj['source_ref']:
                            if obj['source_ref'] not in mitre_refs_to_refs:
                                mitre_refs_to_refs[obj['source_ref']] = []
                            mitre_refs_to_refs[obj['source_ref']].append(obj['target_ref'])
                    if "type" in obj and obj['type'] == "intrusion-set":
                        mitre_refs_to_names[obj['id']] = obj['name']
                    if "external_references" in obj:
                        for reference in obj['external_references']:
                            if "url" in reference and "type" in obj and (obj["type"] == "attack-pattern" or obj["type"] == "x-mitre-tactic") and ( "https://attack.mitre.org/techniques/" in reference['url'] or "https://attack.mitre.org/tactics/" in reference['url'] ):
                                mitre_names[reference['external_id']] = obj['name']
                                mitre_refs_to_names[obj['id']] = reference['external_id']
            with open(os.environ['SPLUNK_HOME'] + "/etc/apps/" + myApps[0] + "/appserver/static/vendor/mitre/pre-attack.json") as f:
                mitre_attack_blob = json.load(f)
                for obj in mitre_attack_blob['objects']:
                    if "type" in obj and obj['type'] == "relationship":
                        if "intrusion-set" in obj['source_ref'] and "attack-pattern" in obj['target_ref']:
                            if obj['target_ref'] not in mitre_refs_to_refs:
                                mitre_refs_to_refs[obj['target_ref']] = []
                            mitre_refs_to_refs[obj['target_ref']].append(obj['source_ref'])
                        if "intrusion-set" in obj['target_ref'] and "attack-pattern" in obj['source_ref']:
                            if obj['source_ref'] not in mitre_refs_to_refs:
                                mitre_refs_to_refs[obj['source_ref']] = []
                            mitre_refs_to_refs[obj['source_ref']].append(obj['target_ref'])
                    if "type" in obj and obj['type'] == "intrusion-set":
                        mitre_refs_to_names[obj['id']] = obj['name']
                    if "external_references" in obj:
                        for reference in obj['external_references']:
                            if "url" in reference and "type" in obj and (obj["type"] == "attack-pattern" or obj["type"] == "x-mitre-tactic") and ( "https://attack.mitre.org/techniques/" in reference['url'] or "https://attack.mitre.org/tactics/" in reference['url'] ):
                                mitre_names[reference['external_id']] = obj['name']
                                mitre_refs_to_names[obj['id']] = reference['external_id']   
            for ref in mitre_refs_to_refs:
                for refvalue in mitre_refs_to_refs[ref]:
                    if ref in mitre_refs_to_names and refvalue in mitre_refs_to_names:
                        if mitre_refs_to_names[ref] not in mitre_techniques_to_groups:
                            mitre_techniques_to_groups[mitre_refs_to_names[ref]] = []
                        if mitre_refs_to_names[refvalue] not in mitre_techniques_to_groups[mitre_refs_to_names[ref]]:
                            mitre_techniques_to_groups[mitre_refs_to_names[ref]].append(mitre_refs_to_names[refvalue])
        except Exception as e:
            debug.append(json.dumps({"status": "ERROR", "description": "Error occurred while handling MITRE Processing", "message": str(e)}))
            throwErrorMessage = True


        try:
            # Now we clear out any invalid characters in IDs and names
            keys = globalSourceList['summaries'].keys()
            debug.append("Debug Starting")
            for summaryName in keys:
                m = re.search("[^a-zA-Z0-9_]", summaryName)
                if m:
                    debug.append("Got a match " + summaryName)
                    newSummaryName = re.sub(r"[^a-zA-Z0-9_\-]", "", summaryName)
                    debug.append("New Summary Name " + newSummaryName)
                    globalSourceList['summaries'][newSummaryName] = globalSourceList['summaries'].pop(summaryName)
                    index = globalSourceList['roles']['default']['summaries'].index(summaryName)
                    globalSourceList['roles']['default']['summaries'][index] = newSummaryName
            
            for summaryName in globalSourceList['summaries']:    
                regex = r"\&[a-zA-Z0-9#]{2,10};"
                m = re.search(regex, globalSourceList['summaries'][summaryName]['name'])
                if m:
                    debug.append("Got a name match " + globalSourceList['summaries'][summaryName]['name'])
                    newName = re.sub(regex, "", globalSourceList['summaries'][summaryName]['name'])
                    debug.append("New name " + newName)
                    globalSourceList['summaries'][summaryName]['name'] = newName
                elif "Allowed" in globalSourceList['summaries'][summaryName]['name']:
                    debug.append("NO NAME match " + globalSourceList['summaries'][summaryName]['name'])
        except Exception as e:
            return {'payload': json.dumps({"response": "Error! clearing.", "error": str(e)}),  
                    'status': 500          # HTTP status code
            }

        try:
            # Now we do enrichment and processing
            for summaryName in globalSourceList['summaries']:
                # Define all the defaults for enrichment
                globalSourceList['summaries'][summaryName]["id"] = summaryName
                globalSourceList['summaries'][summaryName]['enabled'] = "No"
                globalSourceList['summaries'][summaryName]["data_available"] = "Unknown"
                globalSourceList['summaries'][summaryName]["data_available_numeric"] = ""
        except Exception as e:
            return {'payload': json.dumps({"response": "Error! Define the defaults for all enrichment", "message": str(e)}),  
                    'status': 500
            }


        try:
            # Now we do enrichment and processing
            for summaryName in globalSourceList['summaries']:

                # Handle bookmark status
                if summaryName in bookmarks:
                    globalSourceList['summaries'][summaryName]['bookmark_status'] = bookmarks[summaryName]['status']
                    if "user" in bookmarks[summaryName]:
                        globalSourceList['summaries'][summaryName]['bookmark_user'] = bookmarks[summaryName]['user']
                    else: 
                        globalSourceList['summaries'][summaryName]['bookmark_user'] = "none"
                    if "notes" in bookmarks[summaryName]:
                        globalSourceList['summaries'][summaryName]['bookmark_notes'] = bookmarks[summaryName]['notes']
                    else: 
                        globalSourceList['summaries'][summaryName]['bookmark_notes'] = ""
                    if globalSourceList['summaries'][summaryName]['bookmark_status'] in bookmark_display_names:
                        globalSourceList['summaries'][summaryName]['bookmark_status_display'] = bookmark_display_names[globalSourceList['summaries'][summaryName]['bookmark_status']]
                    else:
                        globalSourceList['summaries'][summaryName]['bookmark_status_display'] = globalSourceList['summaries'][summaryName]['bookmark_status']
                
                    if globalSourceList['summaries'][summaryName]['bookmark_status'] == "successfullyImplemented":
                        globalSourceList['summaries'][summaryName]['enabled'] = "Yes"
                else:
                    globalSourceList['summaries'][summaryName]['bookmark_status'] = "none"
                    globalSourceList['summaries'][summaryName]['bookmark_status_display'] = "Not Bookmarked"
                    globalSourceList['summaries'][summaryName]['bookmark_notes'] = ""
        except Exception as e:
            return {'payload': json.dumps({"response": "Error! Bookmark enrichment", "message": str(e)}),  
                    'status': 500
            }

        try:
            for summaryName in globalSourceList['summaries']:
                # Enrich examples with the example data
                if "examples" in globalSourceList['summaries'][summaryName] and len(globalSourceList['summaries'][summaryName]['examples']) > 0:
                    for i in range(0, len(globalSourceList['summaries'][summaryName]['examples'])):
                        if globalSourceList['summaries'][summaryName]['examples'][i]['name'] in globalSearchList:
                            globalSourceList['summaries'][summaryName]['examples'][i]['showcase'] = globalSearchList[globalSourceList['summaries'][summaryName]['examples'][i]['name']]

        except Exception as e:
            return {'payload': json.dumps({"response": "Error! actual search enrichment", "message": str(e)}),  
                    'status': 500
            }

        try:
            for summaryName in globalSourceList['summaries']:                
                # eventtypes_data_status
                if "data_source_categories" in globalSourceList['summaries'][summaryName]:
                    eventtypes = globalSourceList['summaries'][summaryName]['data_source_categories'].split("|")
                    eventtype_display = []
                    datasources = []
                    for eventtype in eventtypes:
                        if eventtype in eventtype_names:
                            eventtype_display.append( eventtype_names[eventtype] )
                            if eventtype in eventtype_to_legacy_names:
                                datasources.append(eventtype_to_legacy_names[eventtype])
                            else:
                                datasources.append(dsc_to_ds_name[eventtype])
                        if eventtype in eventtypes_data_status and eventtypes_data_status[eventtype] != "unknown":
                            globalSourceList['summaries'][summaryName]["data_available_numeric"] = eventtypes_data_status[eventtype]
                            ## TODO: Change the "use last" to "average"
                            if int(eventtypes_data_status[eventtype]) >= 20:
                                globalSourceList['summaries'][summaryName]["data_available"] = "Good"
                            else:
                                globalSourceList['summaries'][summaryName]["data_available"] = "Bad"
                    globalSourceList['summaries'][summaryName]['data_source_categories_display'] = "|".join( eventtype_display )
                    globalSourceList['summaries'][summaryName]['datasource'] ="|".join( datasources )
                # globalSourceList['summaries'][summaryName]['data_source_categories'] = globalSourceList['summaries'][summaryName]['data_source_categories']
                # globalSourceList['summaries'][summaryName]['data_source_categories_display'] = globalSourceList['summaries'][summaryName]['data_source_categories_display']
                # Probably this should be disabled...
                # if summaryName in kvstore_data_status:
                #   globalSourceList['summaries'][summaryName]['data_available'] = kvstore_data_status[summaryName]
                

        except Exception as e:
            return {'payload': json.dumps({"response": "Error! data_availability enrichment", "message": str(e)}),  
                    'status': 500
            }

        try:
            for summaryName in globalSourceList['summaries']:                

                #Do Mitre Display Name Mapping
                globalSourceList['summaries'][summaryName]["mitre_tactic_display"] = []
                globalSourceList['summaries'][summaryName]["mitre_technique_display"] = []
                globalSourceList['summaries'][summaryName]["mitre_threat_groups"] = []
                if "mitre_tactic" in globalSourceList['summaries'][summaryName]:
                    tactics = globalSourceList['summaries'][summaryName]["mitre_tactic"].split("|")
                    for tactic in tactics:
                        if tactic != "":
                            if tactic in mitre_names:
                                globalSourceList['summaries'][summaryName]["mitre_tactic_display"].append(mitre_names[tactic])
                            else:
                                globalSourceList['summaries'][summaryName]["mitre_tactic_display"].append(tactic)
                if "mitre_technique" in globalSourceList['summaries'][summaryName]:
                    techniques = globalSourceList['summaries'][summaryName]["mitre_technique"].split("|")
                    for technique in techniques:
                        if technique != "":
                            if technique in mitre_techniques_to_groups:
                                globalSourceList['summaries'][summaryName]["mitre_threat_groups"] = globalSourceList['summaries'][summaryName]["mitre_threat_groups"] + mitre_techniques_to_groups[technique]
                            if technique in mitre_names:
                                globalSourceList['summaries'][summaryName]["mitre_technique_display"].append(mitre_names[technique])
                            else:
                                globalSourceList['summaries'][summaryName]["mitre_technique_display"].append(technique)
                globalSourceList['summaries'][summaryName]["mitre_threat_groups"] = list(set(  globalSourceList['summaries'][summaryName]["mitre_threat_groups"] )) 
                globalSourceList['summaries'][summaryName]["mitre_threat_groups"].sort()
                globalSourceList['summaries'][summaryName]["mitre_tactic_display"] = "|".join(globalSourceList['summaries'][summaryName]["mitre_tactic_display"])
                globalSourceList['summaries'][summaryName]["mitre_technique_display"] = "|".join(globalSourceList['summaries'][summaryName]["mitre_technique_display"])
                globalSourceList['summaries'][summaryName]["mitre_threat_groups"] = "|".join( globalSourceList['summaries'][summaryName]["mitre_threat_groups"] )
        except Exception as e:
            return {'payload': json.dumps({"response": "Error! mitre enrichment", "message": str(e)}),  
                    'status': 500
            }

        try:
            # Now we default anything that needs to be defaulted
            provide_No_Fields = ["hasSearch"]
            provide_NA_Fields = ["data_source_categories", "data_source_categories_display"]
            provide_none_Fields = []
            provide_Other_Fields = ["category"]
            ensure_no_null_fields = ["custom_time", "custom_user"]
            provide_Uppercasenone_Fields = ["killchain", "mitre", "mitre_tactic", "mitre_technique",  "mitre_tactic_display", "mitre_technique_display", "category", "SPLEase"]

            for summaryName in globalSourceList['summaries']:
                if "channel" not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName]['channel'] == "":
                    if "app" in globalSourceList['summaries'][summaryName]:
                        globalSourceList['summaries'][summaryName]['channel'] = globalSourceList['summaries'][summaryName]['app']
                    else:
                        globalSourceList['summaries'][summaryName]['channel'] = "Unknown"

                for field in provide_NA_Fields:
                    if (field not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName][field] is None or globalSourceList['summaries'][summaryName][field] == "") and field in provide_NA_Fields:
                        globalSourceList['summaries'][summaryName][field] = "N/A"

                for field in provide_No_Fields:
                    if (field not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName][field] is None or globalSourceList['summaries'][summaryName][field] == "") and field in provide_No_Fields:
                        globalSourceList['summaries'][summaryName][field] = "No"

                for field in provide_none_Fields:
                    if (field not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName][field] is None or globalSourceList['summaries'][summaryName][field] == "") and field in provide_none_Fields:
                        globalSourceList['summaries'][summaryName][field] = "none"

                for field in provide_Other_Fields:
                    if (field not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName][field] is None or globalSourceList['summaries'][summaryName][field] == "") and field in provide_Other_Fields:
                        globalSourceList['summaries'][summaryName][field] = "Other"

                for field in provide_Uppercasenone_Fields:
                    if (field not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName][field] is None or globalSourceList['summaries'][summaryName][field] == "") and field in provide_Uppercasenone_Fields:
                        globalSourceList['summaries'][summaryName][field] = "None"

                # for field in ensure_no_null_fields:
                #     if (field not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName][field] == "") and field in ensure_no_null_fields:
                #         globalSourceList['summaries'][summaryName][field] = ""


        except Exception as e:
            return {'payload': json.dumps({"response": "Fatal Error while defaulting", "message": str(e)}),  
                    'status': 500
            }

        try:
            # Clear out excluded content
            keys = globalSourceList['summaries'].keys()
            for summaryName in keys:
                if "includeSSE" not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName]["includeSSE"].lower() != "yes":
                    globalSourceList['summaries'].pop(summaryName)
            globalSourceList['roles']['default']['summaries'] = globalSourceList['summaries'].keys()
            # Now ignoring the roles default summaries in the actual json -- everything is driven by includeSSE
        except Exception as e:
            return {'payload': json.dumps({"response": "Fatal Error pulling excluded content", "message": str(e)}),  
                    'status': 500
            }
        globalSourceList['debug'] = debug
        globalSourceList['throwError'] = throwErrorMessage
        
        return {'payload': globalSourceList,  
                'status': 200          # HTTP status code
        }