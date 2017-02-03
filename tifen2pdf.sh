#!/bin/bash
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 
# Copyright 2017 Marcin Miłkowski <http://marcinmilkowski.pl>
# A short script that takes assumes that a number of files resides in a subdirectory 'out' 
# (created by ScanTailor), and that the scanned text is in English (magic number 9)
#
tiffcp -c g4 $(ls out/$1*.tif) $1_out.tif
cscript modi2hocr.js 9 $1_out.tif $1_out.hocr
java -Xmx512m -jar hocrtopdf-0.0.1.jar $1_out.hocr $1_out.pdf
