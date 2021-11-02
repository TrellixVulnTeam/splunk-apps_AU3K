
acceleration.allow_old_summaries = <bool>
* Sets the default value of 'allow_old_summaries' for this data model.
* Only applies to accelerated datamodels.
* When you use commands like 'datamodel', 'from', or 'tstats' to run a search 
  on this data model, allow_old_summaries=false causes the Splunk software to
  verify that the data model search in each bucket's summary metadata matches 
  the scheduled search that currently populates the data model summary.
  Summaries that fail this check are considered "out of date" and are not used 
  to deliver results for your events search.
* This setting helps with situations where the definition of an accelerated
  data model has changed, but the Splunk software has not yet updated its
  summaries to reflect this change. When allow_old_summaries=false for a data
  model, an event search of that data model only returns results from bucket
  summaries that match the current definition of the data model.
* If you set allow_old_summaries=true, your search delivers results from
  bucket summaries that are out of date with the current data model definition.
* Default: false

acceleration.poll_buckets_until_maxtime = <bool>
* Optional setting. Requires 6.6+
* In a distributed environment that consist of heterogenous machines, summarizations might complete sooner
  on machines with less data and faster resources. After the summarization search is finished with all of 
  the buckets, the search ends. However, the overall search runtime is determined by the slowest machine in the 
  environment. 
* When set to "true": All of the machines run for "max_time" (approximately). 
  The buckets are polled repeatedly for new data to summarize
* Set this to true if your data model is sensitive to summarization latency delays.
* When this setting is enabled, the summarization search is counted against the 
  number of concurrent searches you can run until "max_time" is reached.
* Default: false

tags_whitelist = <list-of-tags>
* Optional setting. Requires 6.6+
* A comma-separated list of tag fields that the data model requires 
  for its search result sets.
* This is a search performance setting. Apply it only to data models 
  that use a significant number of tag field attributes in their 
  definitions. Data models without tag fields cannot use this setting. 
  This setting does not recognize tags used in constraint searches.
* Only the tag fields identified by tag_whitelist (and the event types 
  tagged by them) are loaded when searches are performed with this 
  data model.
* If tags_whitelist is empty, the Splunk software attempts to optimize 
  out unnecessary tag fields when searches are performed with this 
  data model.
* Defaults to empty.
