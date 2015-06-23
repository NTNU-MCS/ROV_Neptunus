This contains the work done in the masters thesis of Jostein Munz, finalized 19th of June 2015. 

This does not include the firmware for the arduino. See the thesis report for further info.
The node module "serialport" was compiles to native windows code. The software on Beaglebone on Neptunus has the arm-linux version 
of this. If this software is to be uploaded to other hardware, the appropriate version of the serialport module needs to be installed. This is done by simply
installing it with npm. This requires an internet connection, see the thesis appendix for how-to.  