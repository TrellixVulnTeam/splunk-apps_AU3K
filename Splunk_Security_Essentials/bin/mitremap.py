#!/usr/bin/python


import json, csv, re, os
import urllib, urllib2

import sys

app = "Splunk_Security_Essentials" 
which_killchain = "attack"
prettyPrint = True

for line in sys.stdin:
  m = re.search("search:\s*(.*?)$", line)
  if m:
          searchString = urllib.unquote(m.group(1))
          if searchString:
            m = re.search("mitremap[^\|]*name=\"*\s*([^ \"]*)", searchString)
            if m:
              which_killchain = m.group(1)
            m = re.search("mitremap[^\|]*pretty=\"*\s*([^ \"]*)", searchString)
            if m:
              if m.group(1).lower() == "false":
                prettyPrint = False


def strip_non_ascii(string):
    ''' Returns the string without non ASCII characters'''
    stripped = (c for c in string if 0 < ord(c) < 127)
    return ''.join(stripped)

mitre_names = {}
phase_short_names_to_tactics = {}
mitre_tactics = {}
mitre_tactics_to_pretty_names = {}

if which_killchain == "attack": 
  with open("../appserver/static/vendor/mitre/enterprise-attack.json") as f:
    mitre_attack_blob = json.load(f)
    for obj in mitre_attack_blob['objects']:
      if "name" in obj:
        obj['name'] = obj['name'].replace(u'\xe4', "a")
        obj['name'] = strip_non_ascii(obj['name'])
      if "external_references" in obj:
        for reference in obj['external_references']:
          if "url" in reference and ( "https://attack.mitre.org/techniques/" in reference['url'] or "https://attack.mitre.org/tactics/" in reference['url'] ):
            mitre_names[ reference['external_id'] ] = obj['name']
          if "url" in reference and "https://attack.mitre.org/tactics/" in reference['url']:
            mitre_tactics[ reference['external_id'] ] = []
            mitre_tactics_to_pretty_names[ reference['external_id'] ] = obj['name']
            phase_short_names_to_tactics[ obj['x_mitre_shortname'] ] = reference['external_id']
    
    for obj in mitre_attack_blob['objects']:
      if "external_references" in obj:
        for reference in obj['external_references']:
          if "url" in reference and  "https://attack.mitre.org/techniques/" in reference['url'] :
            if "kill_chain_phases" in obj:
              for phase in obj['kill_chain_phases']:
                if phase['kill_chain_name'] == "mitre-pre-attack" or phase['kill_chain_name'] == "mitre-attack":
                  if phase['phase_name'] in phase_short_names_to_tactics:
                    if prettyPrint:
                      mitre_tactics[ phase_short_names_to_tactics[ phase['phase_name'] ] ].append(obj['name'])
                    else:
                      mitre_tactics[ phase_short_names_to_tactics[ phase['phase_name'] ] ].append( reference['external_id'] )

elif which_killchain == "preattack":
  with open("../appserver/static/vendor/mitre/pre-attack.json") as f:
    mitre_attack_blob = json.load(f)
    for obj in mitre_attack_blob['objects']:
      if "external_references" in obj:
        for reference in obj['external_references']:
          if "url" in reference and ( "https://attack.mitre.org/techniques/" in reference['url'] or "https://attack.mitre.org/tactics/" in reference['url'] ):
            mitre_names[reference['external_id']] = obj['name']
          if "url" in reference and "https://attack.mitre.org/tactics/" in reference['url']:
            mitre_tactics[reference['external_id']] = []
            mitre_tactics_to_pretty_names[ reference['external_id'] ] = obj['name']
            phase_short_names_to_tactics[ obj['x_mitre_shortname'] ] = reference['external_id']

    for obj in mitre_attack_blob['objects']:
      if "external_references" in obj:
        for reference in obj['external_references']:
          if "url" in reference and  "https://attack.mitre.org/techniques/" in reference['url'] :
            if "kill_chain_phases" in obj:
              for phase in obj['kill_chain_phases']:
                if phase['kill_chain_name'] == "mitre-pre-attack" or phase['kill_chain_name'] == "mitre-attack":
                  if phase['phase_name'] in phase_short_names_to_tactics:
                    if prettyPrint:
                      mitre_tactics[ phase_short_names_to_tactics[ phase['phase_name'] ] ].append(obj['name'])
                    else:
                      mitre_tactics[ phase_short_names_to_tactics[ phase['phase_name'] ] ].append( reference['external_id'] )

else:
  print "Error!"
  print '"' + "Could not find an attack phase called: " + which_killchain.replace('"', '""') + '"'
  sys.exit()

#print json.dumps(mitre_tactics, sort_keys = True, indent=4)
# w = csv.DictWriter(sys.stdout, mitre_tactics.keys())
# w.writeheader()
# w.writerow(mitre_tactics)

# w = csv.writer(sys.stdout)
# w.writerows(mitre_tactics.items())

columns = mitre_tactics.keys()
columns.sort()

w = csv.writer(sys.stdout)

if prettyPrint:
  pretty_columns = []
  for column in columns:
    mitre_tactics[column].sort()
    pretty_columns.append(mitre_tactics_to_pretty_names[column])
  w.writerow(pretty_columns)
else:
  w.writerow(columns)



    # for tactic in mitre_tactics.keys():
    #   mitre_tactics[ mitre_tactics_to_pretty_names[tactic] ] = mitre_tactics[tactic]
    #   mitre_tactics.pop(tactic)


longest_key = len(mitre_tactics[max(mitre_tactics, key= lambda x: len(set(mitre_tactics[x])))])
for i in range(0, longest_key):
  currentRow = []
  for tactic in columns:
    if i < len(mitre_tactics[tactic]):
      currentRow.append(mitre_tactics[tactic][i])
    else:
      currentRow.append("")
  w.writerow(currentRow)
