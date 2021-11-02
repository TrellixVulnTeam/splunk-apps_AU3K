#!/usr/bin/env python
"""
valid algorithms:

# distance, 2 words
- levenshtein_distance
- damerau_levenshtein_distance
- jaro_distance
- jaro_winkler
- match_rating_comparison
- hamming_distance

# phonetic, 1 word
- soundex
- nysiis
- match_rating_codex
- metaphone
- porter_stem


... | jellyfisher levensthein_distance(sourcetype,source)
... | jellyfisher soundex(sourcetype)

... | jellyfisher levensthein_distance(sourcetype,lookup:processNames)

Examples:

index=_internal | head 20 | jellyfisher soundex(user) 


NOTE:
The logic with 'lookup:' is almost supported but not finished yet. The
Splunk commands map and/or foreach seems to solve the problem.


| inputlookup processNames.csv  
| map search="search index=_internal | head 10 | stats count by sourcetype | eval pName = $processName$ | jellyfisher levenshtein_distance($processName$, sourcetype)" 
| table sourcetype, pName, levenshtein_distance

"""

import re
import sys
import json

import jellyfish

from cexc import BaseChunkHandler
from splunk.clilib.bundle_paths import make_splunkhome_path


class JellyFisherCommand(BaseChunkHandler):
    preg_t = re.compile("([^(]+)\(([^)]+)")

    # distances, 2 words
    _distance_algorithms = [
	"levenshtein_distance", 
	"damerau_levenshtein_distance",
	"jaro_distance",
	"jaro_winkler",
	"match_rating_comparison",
	"hamming_distance"
    ]

    # phonetic, 1 word
    _phonetic_algorithms = [
	"soundex",
	"nysiis",
	"match_rating_codex",
	"metaphone",
	"porter_stem"
    ]


    # defaults
    req_fields = []
    _uses_lookup = False

    def _parse_arguments(self, args):
	"""
	very simple parser
	"""
	# args = [u'john=mc', u'lane', u'wo=tic tic']
	
	strarg = ", ".join(args) # pouet(yolo, input:on)

	ret = self.preg_t.search( strarg )
	self._algorithm = ret.group(1) # pouet
	self._arguments = [x.strip() for x in ret.group(2).split(",")] # [u'yolo', u'lookup:bheh']
	self._n_arguments = len(self._arguments)

	if self._algorithm in self._phonetic_algorithms and self._n_arguments != 1:
		raise ValueError("phonetic algorithms takes one argument as input")

	if self._algorithm in self._distance_algorithms and self._n_arguments != 2:
		raise ValueError("distance algorithms takes two arguments as input")

	if not self._algorithm in self._distance_algorithms and not self._algorithm in self._phonetic_algorithms:
		raise ValueError("%s is not a valid algorithm" % self._algorithm)

	for a in self._arguments:
		if a.startswith("lookup:") :
			self._uses_lookup = True
			continue
		self.req_fields.append( a )

	if self._algorithm in self._phonetic_algorithms and self._uses_lookup :
		raise ValueError("unsupported branching: lookups cannot be used with phonetic algorithms")

    # metadata is a dict with the parsed JSON metadata payload.
    # data is a list of dicts, where each dict represents a search result.
    def handler(self, metadata, data):

        # The first chunk is a "getinfo" chunk.
        if metadata['action'] == 'getinfo':
		try:
			args = metadata['searchinfo']['args']
		except:
			args = []

		self._parse_arguments(args)

		#return {'type': 'streaming', 'required_fields':[ self.field ]}
		return {'type': 'streaming', 'required_fields': self.req_fields }

        # Subsequent chunks will have the "execute" action.

	# phonetic algorithm, 1 word
	if self._n_arguments == 1:
		f = self.req_fields[0]

		for record in data:
			word = record[ f ]
			r = getattr(jellyfish, self._algorithm)(unicode(word))
			record.update({self._algorithm : r})

	# distance algorithm, 2 words
	elif self._n_arguments == 2 :
		if self._uses_lookup :
			raise ValueError("unsupported yet")
		else:
			f1 = self.req_fields[0]
			f2 = self.req_fields[1]

			for record in data:
				w1 = record[ f1 ]
				w2 = record[ f2 ]

				r = getattr(jellyfish, self._algorithm)(unicode(w1), unicode(w2))
				record.update({self._algorithm : r})
 
        return (
            {'finished': metadata['finished']},
            data
        )

if __name__ == "__main__":
    JellyFisherCommand().run()
