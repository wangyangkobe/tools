#!/bin/python

import os
import sys
import shutil
import multiprocessing
'''os.system("cleartool setview elqstux_ki_ppb")'''

ftPath = "/vobs/mgwblade/PPB/SBG_HSD10196_1/test/auto"
sgcPath = "/vobs/mgwblade/SGC/SGC_CSA10105_4/SGC_CRA1190962"
somPath = "/vobs/mgwblade/SOM/SOM_CRA1190221"
syfPath = "/vobs/mgwblade/SYF/SYF_CRA1190070"
dstPath = "/tmp"
extensionList = [".inc", ".xml", ".erl", ".txt", ".hrl", ".ptts", ".pdf", ".doc", ".appSrc", "*.dia", ".upgSrc"]

def copyFile(srcPath, dstPath):
	'''Copy the file for srcPath to dstPath'''
	baseName = os.path.basename(srcPath)
	#if baseName ==  "inc":
	#	baseName = "include"
	targetPath  = os.path.join(dstPath, baseName)
	if not os.path.exists(targetPath):
		os.mkdir(targetPath)

	for name in os.listdir(srcPath):
		srcName = os.path.join(srcPath, name)
		try:
			if os.path.isdir(srcName):
				copyFile(srcName, targetPath)	
			else:
				fileExtension = os.path.splitext(srcName)[1]
				if fileExtension in extensionList:
					shutil.copy2(srcName, targetPath)
		except:
			pass

def doCopy(srcPath):
	copyFile(srcPath, dstPath)
	tarFilePath = os.path.join(os.path.expanduser("~"), os.path.basename(srcPath) + ".tar.gz")
	print(tarFilePath)
	os.chdir("/tmp")
	os.system("tar -zcf %s %s" % ( tarFilePath, os.path.basename(srcPath) ))
	
def make_tar(file_to_back, dest_folder, compression="bz2"):
	import tarfile
	des_ext = "." + compression if compression else ""
	arcname = os.path.basename(file_to_back)
	dest_name = "%s.tar%s" % (arcname, des_ext)
	dest_path = os.path.join(dest_folder, dest_name)
	dest_cmp = ":" + compression if compression else ""
	outfile = tarfile.TarFile.open(dest_path, "w"+dest_cmp)
	outfile.add(file_to_back, arcname)
	outfile.close()
	return dest_path


if __name__ == '__main__':
	if len(sys.argv) == 1:
		pool = multiprocessing.Pool(4)
		pool.map(doCopy, [sgcPath, somPath, syfPath, ftPath])
		print("All done!")
	else:
		input = sys.argv[1]
		if input == "sgc":
			doCopy(sgcPath)
		elif input == "som":
			doCopy(somPath)
		elif input == "syf":
			doCopy(syfPath)
		else:
			doCopy(ftPath)
	#make_tar(os.path.basename(syfPath), os.path.expanduser("~"))
