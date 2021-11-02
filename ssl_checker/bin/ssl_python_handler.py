import splunk.admin as admin
import shutil, os, sys

# -----------------------------------------------
# setup.xml uses this script to update ssl.conf
# ----------------------------------------------
class SSLHandler(admin.MConfigHandler):
  # -------------------------------------------------------
  # set the read / optional arguments for the diff actions
  # -------------------------------------------------------
  def setup(self):
    if self.requestedAction in (admin.ACTION_CREATE,):
      self.supportedArgs.addReqArg("certPaths")
    if self.requestedAction in (admin.ACTION_CREATE,admin.ACTION_EDIT):
      self.supportedArgs.addOptArg("certPaths")
    if self.requestedAction in (admin.ACTION_EDIT,):
      self.supportedArgs.addOptArg("certPaths")
    
  # -------------------------------- 
  # create the ssl.conf file
  # --------------------------------
  def handleCreate(self, confInfo):
    settings = self.callerArgs.copy()
    pathProvided = False
    if 'certPaths' in self.callerArgs.data.keys() and self.callerArgs['certPaths']:
       pathProvided = True
    if not pathProvided:
       raise admin.ArgValidationException, "A path must be provided"   
    self.updateConf("ssl", self.callerArgs.id, self.callerArgs.data);
  # ---------------------------------------
  # lists out all the configs in ssl.conf
  # ---------------------------------------
  def handleList(self, confInfo):
    confDict = self.readConf("ssl")
    # if the file doesn't exist, None is returned.
    if None != confDict:
      # return all these settings by populating confInfo.
      for stanza, settings in confDict.items():
        for key, val in settings.items():
          confInfo[stanza].append(key, val)

  # ----------------------------------- 
  # edits a config item from ssl.conf
  # -----------------------------------
  def handleEdit(self, confInfo):
    # let's make sure this thing exists, first...
    existing = admin.ConfigInfo()
    self.handleList(existing)
    if not self.callerArgs.id in existing:
      raise admin.ArgValidationException, "Cannot edit '%s', it does not exist." % self.callerArgs.id
    self.updateConf("ssl", self.callerArgs.id, self.callerArgs.data)

admin.init(SSLHandler, admin.ACTION_CREATE | admin.ACTION_EDIT | admin.ACTION_LIST)
