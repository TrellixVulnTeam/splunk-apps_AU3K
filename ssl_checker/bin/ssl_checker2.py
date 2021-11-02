__doc__ = """
# Copyright 2016 Michael Camp Bentley aka JKat54
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
"""
import splunk.mining.dcutils as dcu
logger = dcu.getLogger()
import subprocess, sys, os, ConfigParser, string, shutil

# path to the configuration ssl.conf file
scriptDir = sys.path[0] 
configDefaultFileName = os.path.join(scriptDir,'..','default','ssl.conf')
configLocalFileName = os.path.join(scriptDir,'..','local','ssl.conf')

# name of the only stanza in the config file
configSectionName = "SSLConfiguration"

def readConfig():
 # When local\ssl.conf is in UTF-8 w/BOM encoding, ssl_checker2.py fails to read from it.
 # Upon first execution of setup.xml, the local\ssl.conf file is created with UTF-8 encoding
 # The try detects this issue and the except rewrites the file in ASCII format to fix this
 path = ''
 if os.path.exists(configLocalFileName):
  path = configLocalFileName
 elif os.path.exists(configDefaultFileName):
  path = configDefaultFileName
 try:
  config = ConfigParser.RawConfigParser()
  config.read(path)
  val = string.split(str(config.get(configSectionName, "certPaths")).replace(" ",""),",")
 except:
  configLocalFileNewName = os.path.join(scriptDir,'..','local','ssl.conf_tmp')
  with open(configLocalFileName, 'r') as fileName:
   with open(configLocalFileNewName, 'w') as targetfile:
    for line in fileName:
     line = line.decode("utf-8")
     newline = line.encode("ascii","ignore")
     targetfile.write(newline)
  shutil.move(configLocalFileNewName,configLocalFileName)
  path = configLocalFileName  
  config = ConfigParser.RawConfigParser()
  config.read(path)
  val = string.split(str(config.get(configSectionName, "certPaths")).replace(" ",""),",")
 return(val)
 
try:
 splunk_home = os.getenv('SPLUNK_HOME')
 if not splunk_home:
  raise ConfigError('Environment variable SPLUNK_HOME must be set. Run: source ~/bin/setSplunkEnv')
 CERTPATHS = readConfig()
 if os.name == 'nt':
  #windows splunk logic
  for CERTFILE in CERTPATHS:
   # insure cert exists on path given in CERTFILE var
   if os.path.isfile(CERTFILE):
    # find openssl path
    binPath = sys.argv[0].replace('\\etc\\apps\\ssl_checker\\bin\\ssl_checker2.py','\\bin')
    openssl_path = binPath + "\\openssl.exe"
    if os.path.isfile(openssl_path):
     # get cert data
     p1 = subprocess.Popen([openssl_path,"x509","-enddate","-noout","-in",CERTFILE], stdout=subprocess.PIPE)
     dates = str(p1.communicate()[0])
     p1.stdout.close()
     message = 'cert="' + CERTFILE + '" ' + dates.replace('=','="').replace('\n','"|').replace('|',' ')
     message = message.replace("notAfter","expires")
     print(message)
    else:
     print("Couldnt find openssl on path " + openssl_path + ".")
     logger.exception("Couldnt find openssl on path " + openssl_path + ".")
   else:
    print("Couldnt find certificate on path " + CERTFILE + ".")
    logger.exception("Couldnt find certificate on path " + CERTFILE + ".")  
 elif os.name == 'posix':
  #linux splunk logic
  for CERTFILE in CERTPATHS:
   # insure cert exists on path given in CERTFILE var
   if os.path.isfile(CERTFILE):
    # find openssl path
    binPath = sys.argv[0].replace('/etc/apps/ssl_checker/bin/ssl_checker2.py','/bin')
    openssl_path = binPath + "/openssl"
    if os.path.isfile(openssl_path):
     # get cert data
     p1 = subprocess.Popen([openssl_path,"x509","-enddate","-noout","-in",CERTFILE], stdout=subprocess.PIPE)
     dates = str(p1.communicate()[0])
     p1.stdout.close()
     message = 'cert="' + CERTFILE + '" ' + dates.replace('=','="').replace('\n','"|').replace('|',' ')
     message = message.replace("notAfter","expires")
     print(message)
    else:
     print("Couldnt find openssl on path " + openssl_path + ".")
     logger.exception("Couldnt find openssl on path " + openssl_path + ".")
   else:
    print("Couldnt find certificate on path " + CERTFILE + ".")
    logger.exception("Couldnt find certificate on path " + CERTFILE + ".")
 else:
  print("Cant determine OS type, this add on is only compatible with Linux & Windows")
  logger.error("Cant determine OS type, this add on is only compatible with Linux & Windows")
except Exception as e:
 print(e)
 logger.exception(e)

