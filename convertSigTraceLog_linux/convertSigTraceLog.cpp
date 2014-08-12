#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>
#include <algorithm>
#include <cstdlib>
#include <sstream>
#include <fstream>

#ifdef _WIN32
	#include "getopt.h"
#else
	#include <unistd.h>
#endif

#include "tinyxml2.h"

using namespace std;
using namespace tinyxml2;

string hex_to_string(const string& input)
{
	static const char* const mask = "0123456789ABCDEF";
	size_t len = input.length();
	if (len & 1) throw std::invalid_argument("odd length");

	string output;
	output.reserve(len / 2);
	for (size_t i = 0; i < len; i += 2)
	{
		char a = input[i];
		const char* p = std::lower_bound(mask, mask + 16, a);
		if (*p != a) throw string("not a hex digit");

		char b = input[i + 1];
		const char* q = std::lower_bound(mask, mask + 16, b);
		if (*q != b) throw string("not a hex digit");

		output.push_back(((p - mask) << 4) | (q - mask));
	}
	return output;
}

// decode {address == 147.214.16.150, port == 8004, transport == UDP}
const string handleAddress(const string& input)
{
	char ip[50] = {'\0'};
	int  port;
	char type[5] = {'\0'};

	sscanf(input.c_str(),
		"{address == %[a-zA-Z0-9.:], port == %d, transport == %[a-zA-Z]}",
		ip, &port, type);
	stringstream result;
	result<<ip<<":"<<port<<" "<<type;
	return result.str();
}

void extractElement(const char* fileName,
	vector<string>& msgVec,
	vector<string>& initiator,
	vector<string>& target)
{
	XMLDocument doc;
	if( doc.LoadFile(fileName) != 0 )
		throw string("The input file is invalidate xml file!");

	XMLElement* root = doc.RootElement();
	if(!root) throw string("Invalidate signal traceing log file!");

	XMLElement* traceRecSession = root->FirstChildElement("traceRecSession");
	if(!traceRecSession)
		throw string("Invalidate signal traceing log file!");

	XMLElement* msg = traceRecSession->FirstChildElement("msg");

	while(msg)
	{
		XMLElement* rawMsg  = msg->FirstChildElement("rawMsg");
		XMLElement* initEle = msg->FirstChildElement("initiator");
		XMLElement* tarEle  = msg->FirstChildElement("target");
		msgVec.push_back(rawMsg->GetText());
		initiator.push_back(handleAddress(initEle->GetText()));
		target.push_back(handleAddress(tarEle->GetText()));

		msg =  msg->NextSiblingElement();
	}

}
void writeFile(ostream& out,
	vector<string>& msgVec,
	vector<string>& initiator,
	vector<string>& target)
{
	vector<string>::size_type len = msgVec.size();
	for(int i = 0; i < len; i++)
	{
		out<<initiator.at(i)<<"  ------->  "<<target.at(i)<<endl;
		out<<hex_to_string(msgVec.at(i))<<endl;
	}
}

void printUsage(char* binName)
{
	printf("Usage: %s [Option] [File] ...\n", binName);
	printf("   -h Display the help for this command.\n");
	printf("   -i The input file name, write result to console.\n");
	printf("   -o The output file name, write result to this file.\n");
#ifdef _WIN32
	printf("Example: ./%s -i singal_tracing_log.xml -o outPutFileName\n", binName);
#else
	printf("Example: %s -i singal_tracing_log.xml -o outPutFileName\n", binName);
#endif
	printf("\n");
}

int main(int argc, char** argv)
{
	if (1 == argc)
	{
		printUsage(argv[0]);
		exit(0);
	}

	char* input  = NULL;
	char* output = NULL;
	int res;
	while((res = getopt(argc, argv, "hi:o:")) != -1)
	{
		switch(res)
		{
		case 'h':
			{
				break;
			}
		case 'i':
			{
				input = optarg;
				break;
			}
		case 'o':
			{
				output = optarg;
				break;
			}
		default:
			;
		}
	}

	vector<string> msgVec;
	vector<string> initiator;
	vector<string> target;
	try{
		if (output && input)
		{
			ofstream outFile(output);
			if(!outFile.is_open())
			{
				printf("Can't open the ouptfile!\n");
				exit(0);
			}
			extractElement(input, msgVec, initiator, target);
			writeFile(outFile, msgVec, initiator, target);
			outFile.close();
			printf("Covert finished! Please check %s.\n", output);
		}
		else if (input)
		{
			extractElement(input, msgVec, initiator, target);
			writeFile(cout, msgVec, initiator, target);
		}
		else
		{
			printUsage(argv[0]);
			exit(0);
		}
	}
	catch(string& e){
		cout<<e<<endl;
	}
	catch(...){
		cout<<"Invalidate signal traceing log file!"<<endl;;
	}
	return 0;
}

