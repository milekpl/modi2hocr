Short instructions:

modi2hocr works for tif files processed with Microsoft Office. You can do it interactively,
by using various parameters. If you don't, it will do it offline, which is slower but saves
the results for every page, and this way you don't waste time because of crashing (and the OCR
engine in MS Office does crash very, very often!).

Run tif2pdf.bat from the directory where your tif file resides. For processing the input file,
I recommend Scan Tailor (http://scantailor.sourceforge.net/): note you have to concatenate all
the result tif files into a single file by yourself (for example, using tiffcp command on most 
UNIX boxes and in Cygwin). Probably there are interactive tools but I don't use them.

Syntax is:

tif2pdf.bat <language_number> <filename>

The language_number is one of these:

Chinese Simplified = 2052
Czech = 5
Danish = 6
Dutch = 19
Finnish = 11
French = 12
German = 7
Greek = 8
Hungarian = 14
Italian = 16
Japanese = 17
Korean = 18
Norwegian = 20
Polish = 21
Portuguese = 22
Russian = 25
Spanish = 10
Swedish = 29
Turkish = 31
Default system language = 2048

Availability of languages depends on your version of Microsoft Office.

Then sit and wait until it finishes.
