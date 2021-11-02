##!/usr/bin/python


import json, csv, re, os
import urllib, urllib2

import sys

sessionKey = ""
owner = "" 
app = "Splunk_Security_Essentials" 
includeAllContent = "false"
includeJSON = False
for line in sys.stdin:
  m = re.search("search:\s*(.*?)$", line)
  if m:
          searchString = urllib.unquote(m.group(1))
          if searchString:
            m = re.search("sseanalytics[^\|]*app=\"*\s*([^ \"]*)", searchString)
            if m:
              app = m.group(1)
            m = re.search("sseanalytics[^\|]*include_all=\"*\s*(true|True|TRUE|yes|Yes|YES|1)", searchString)
            if m:
              includeAllContent = "true"
            m = re.search("sseanalytics[^\|]*include_json=\"*\s*(true|True|TRUE|yes|Yes|YES|1)", searchString)
            if m:
              includeJSON = True
  m = re.search("sessionKey:\s*(.*?)$", line)
  if m:
          sessionKey = m.group(1)
  m = re.search("owner:\s*(.*?)$", line)
  if m:
          owner = m.group(1)

import splunk.entity, splunk.Intersplunk
settings = dict()

from splunk.clilib.cli_common import getConfKeyValue


base_url = "https://" + getConfKeyValue('web', 'settings', 'mgmtHostPort')

request = urllib2.Request(base_url + '/services/SSEShowcaseInfo?app=' + app + '&includeAllContent=' + includeAllContent,
    headers = { 'Authorization': ('Splunk %s' % sessionKey)})
search_results = urllib2.urlopen(request)
globalSourceList = json.loads(search_results.read())

# for summaryName in globalSourceList['summaries']:
#   if "examples" in globalSourceList['summaries'][summaryName]:
#     for i in range(0, len(globalSourceList['summaries'][summaryName]['examples'])):
#       globalSourceList['summaries'][summaryName]['example' + str(i)] = dict()
#       globalSourceList['summaries'][summaryName]['example' + str(i)]['name'] = globalSourceList['summaries'][summaryName]['examples'][i]['name']
#       globalSourceList['summaries'][summaryName]['example' + str(i)]['label'] = globalSourceList['summaries'][summaryName]['examples'][i]['label']
#       if globalSourceList['summaries'][summaryName]['examples'][i]['name'] in globalSearchList:
#         globalSourceList['summaries'][summaryName]['example' + str(i)]['object'] = globalSearchList[ globalSourceList['summaries'][summaryName]['examples'][i]['name'] ]
#         globalSourceList['summaries'][summaryName]['example' + str(i)]['object']['numDescriptions'] = 0
#         globalSourceList['summaries'][summaryName]['example' + str(i)]['object']['numPreReqs'] = 0
#         if "prereqs" in globalSourceList['summaries'][summaryName]['example' + str(i)]['object']:
#           globalSourceList['summaries'][summaryName]['example' + str(i)]['object']['numPreReqs'] = len(globalSourceList['summaries'][summaryName]['example' + str(i)]['object']['prereqs'])
#         if "description" in globalSourceList['summaries'][summaryName]['example' + str(i)]['object']:
#           globalSourceList['summaries'][summaryName]['example' + str(i)]['object']['numDescriptions'] = len(globalSourceList['summaries'][summaryName]['example' + str(i)]['object']['description'])
#     del globalSourceList['summaries'][summaryName]['examples']

provide_NA_Fields = ["data_source_categories", "data_source_categories_display"]
fields = ["name", "id", "usecase", "__mv_usecase", "category", "__mv_category", "domain", "__mv_domain", "journey", "highlight", "bookmark_status", "bookmark_status_display", "bookmark_user", "displayapp", "app", "datasource", "__mv_datasource", "data_source_categories", "__mv_data_source_categories", "data_source_categories_display", "__mv_data_source_categories_display", "data_available", "data_available_numeric", "enabled", "description", "hasSearch", "includeSSE", "dashboard", "mitre", "__mv_mitre", "mitre_tactic", "__mv_mitre_tactic", "mitre_tactic_display", "__mv_mitre_tactic_display", "mitre_technique", "__mv_mitre_technique", "mitre_technique_display", "__mv_mitre_technique_display", "mitre_threat_groups", "__mv_mitre_threat_groups", "killchain", "__mv_killchain", "alertvolume", "SPLEase", "released", "printable_image"]
doMVConversion = ["usecase", "category" , "domain", "datasource", "data_source_categories", "data_source_categories_display", "mitre", "mitre_tactic", "mitre_tactic_display", "mitre_technique", "mitre_technique_display", "mitre_threat_groups", "killchain" ]
if includeJSON:
  print ",".join(fields) + ",summaries"
else:
  print ",".join(fields)


regex = '"'
for summaryName in globalSourceList['summaries']:
  line = json.dumps(globalSourceList['summaries'][summaryName], sort_keys=True)
  output = ""
  for field in fields:
    if "__mv_" not in field:
      if (field not in globalSourceList['summaries'][summaryName] or globalSourceList['summaries'][summaryName][field] == "") and field in provide_NA_Fields:
        globalSourceList['summaries'][summaryName][field] = "N/A"
      if field in globalSourceList['summaries'][summaryName]:
        # output += '"' + re.sub('\n', '\r', re.sub('"', '""', globalSourceList['summaries'][summaryName][field])) + '",'
        if field in doMVConversion:
          items = globalSourceList['summaries'][summaryName][field].split("|")
          output += '"' + re.sub('"', '""', "\n".join(items) ) + '",'
          output += '"' + re.sub('"', '""', "$" + "$;$".join(items) + "$") + '",'
          #output += '"' + re.sub('"', '""', re.sub('\n', '', "$" + "$\n$".join(items) + "$")) + '",'
          #output += '"' + re.sub('"', '""', re.sub('\|', '\n', re.sub('\n', '', globalSourceList['summaries'][summaryName][field]))) + '",'
        else: #if type(globalSourceList['summaries'][summaryName][field]) == str:
          output += '"' + re.sub('\n', '\r', re.sub('"', '""', str(globalSourceList['summaries'][summaryName][field]))) + '",'
        #else:
        #  output += '"' + str(globalSourceList['summaries'][summaryName][field]) + '",'
      else:
        output += ','
  if includeJSON:
    output += '"' + re.sub('\n', '', re.sub('"', '""', line)) + '"'
  print output
