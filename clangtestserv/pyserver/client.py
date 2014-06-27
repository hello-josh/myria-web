#from http://thomasfischer.biz/python-simple-json-tcp-server-and-client/
import socket
import json
import cgi

# sends data json to server
#data = {"plan": "plan", "qid":123}
data = {
   "qid":1,
   "plan":"// Precount_select: Use buckets to track the number of matches\n// Use buckets to copy into the result array\n#include <stdio.h>\n#include <stdlib.h> // for exit()\n#include <fcntl.h> // for open()\n#include <unistd.h> // for close()\n#include <sys/stat.h> // for fstat()\n#include <ctype.h> // for isdigit()\n#include <string.h>\n#include <errno.h>\n#include <sys/types.h>\n#include <sys/stat.h>\n#include <sys/file.h>\n\n#ifdef __MTA__\n#include <machine/runtime.h>\n#include <luc/luc_common.h>\n#include <snapshot/client.h>\n#include <sys/mta_task.h>\n\n\ntypedef int int64;\ntypedef unsigned uint64;\n#else\n#include <sys/time.h>\n\n#include <cstdint>\n#include <iostream>\ntypedef int64_t int64;\ntypedef uint64_t uint64;\n \n#include <unordered_map>\n#include <vector>\n#endif\n\n#include \"io_util.h\"\n#include \"counters_util.h\"\n#include \"hash.h\"\n#include \"utils.h\"\n#include \"strings.h\"\n\n// ------------------------------------------------------------------\n\n#define Subject 0\n#define Predicate 1\n#define Object 2\n#define Graph 3\n\n#define XXX 330337405\n#define YYY 1342785348\n#define ZZZ 1395042699\n\n#define buckets 100000\n\nuint64_t emit_count=0;\n\nconst uint64 mask = (1L << 53) - 1;\n/*\n// Insert a value into a hash table\nvoid insert(uint64 **ht1, uint64 size1, uint64 offset)\n{\n uint64 hash = (uint64(offset) & mask) % size1;\n#ifdef __MTA__\n while (1) {\n if (!readff(ht1 + hash)) {\n uint64 *p = readfe(ht1 + hash); // lock it\n if (p) writeef(ht1 + hash, p); // unlock and try again\n else break;\n }\n hash++;\n if (hash == size1)\n hash = 0;\n }\n writeef(ht1 + hash, relation2 + i); // unlock it\n#else\n while (ht1[hash]) {\n hash++;\n if (hash == size1) hash = 0;\n }\n ht1[hash] = relation2 + i;\n#endif\n}\n*/\n\n\ninline bool equals(struct relationInfo *left, uint64 leftrow, uint64 leftattribute\n , struct relationInfo *right, uint64 rightrow, uint64 rightattribute) {\n /* Convenience function for evaluating equi-join conditions */\n uint64 leftval = left->relation[leftrow*left->fields + leftattribute];\n uint64 rightval = right->relation[rightrow*right->fields + rightattribute];\n return leftval == rightval;\n}\n\n\n // can be just the necessary schema\n class MaterializedTupleRef_V1_0 {\n\n public:\n int64_t _fields[1];\n \n\n int64_t get(int field) const {\n return _fields[field];\n }\n \n void set(int field, int64_t val) {\n _fields[field] = val;\n }\n \n int numFields() const {\n return 1;\n }\n \n MaterializedTupleRef_V1_0 () {\n // no-op\n }\n\n MaterializedTupleRef_V1_0 (std::vector<int64_t> vals) {\n for (int i=0; i<vals.size(); i++) _fields[i] = vals[i];\n }\n \n std::ostream& dump(std::ostream& o) const {\n o << \"Materialized(\";\n for (int i=0; i<numFields(); i++) {\n o << _fields[i] << \",\";\n }\n o << \")\";\n return o;\n }\n \n \n public:\n MaterializedTupleRef_V1_0 (relationInfo * rel, int row) {\n _fields[0] = rel->relation[row*rel->fields + 0];\n \n }\n \n } ;\n std::ostream& operator<< (std::ostream& o, const MaterializedTupleRef_V1_0& t) {\n return t.dump(o);\n }\n\n \n\n // can be just the necessary schema\n class MaterializedTupleRef_V2_0_1 {\n\n public:\n int64_t _fields[2];\n \n\n int64_t get(int field) const {\n return _fields[field];\n }\n \n void set(int field, int64_t val) {\n _fields[field] = val;\n }\n \n int numFields() const {\n return 2;\n }\n \n MaterializedTupleRef_V2_0_1 () {\n // no-op\n }\n\n MaterializedTupleRef_V2_0_1 (std::vector<int64_t> vals) {\n for (int i=0; i<vals.size(); i++) _fields[i] = vals[i];\n }\n \n std::ostream& dump(std::ostream& o) const {\n o << \"Materialized(\";\n for (int i=0; i<numFields(); i++) {\n o << _fields[i] << \",\";\n }\n o << \")\";\n return o;\n }\n \n \n public:\n MaterializedTupleRef_V2_0_1 (relationInfo * rel, int row) {\n _fields[0] = rel->relation[row*rel->fields + 0];\n _fields[1] = rel->relation[row*rel->fields + 1];\n \n }\n \n } ;\n std::ostream& operator<< (std::ostream& o, const MaterializedTupleRef_V2_0_1& t) {\n return t.dump(o);\n }\n\n \nstd::vector<MaterializedTupleRef_V1_0> result;\n\n\nStringIndex string_index;\nvoid init( ) {\n}\n\n\nvoid query(struct relationInfo *resultInfo)\n{\n printf(\"\\nstarting Query\\n\");\n\n int numCounters = 7;\n int currCounter = 0;\n int *counters = mallocCounterMemory(numCounters);\n\n double start = timer();\n\n getCounters(counters, currCounter);\n currCounter = currCounter + 1; // 1\n \n uint64 resultcount = 0;\n struct relationInfo A_val;\n struct relationInfo *A = &A_val;\n\n\n // -----------------------------------------------------------\n // Fill in query here\n // -----------------------------------------------------------\n \n\n \n /*\n=====================================\n Scan(R)\n=====================================\n*/\n\nprintf(\"V2 = Scan(R)\\n\");\n\nstruct relationInfo V2_val;\n\n#ifdef __MTA__\n binary_inhale(\"R\", &V2_val);\n //inhale(\"R\", &V2_val);\n#else\n inhale(\"R\", &V2_val);\n#endif // __MTA__\n\nstruct relationInfo *V2 = &V2_val;\n// Compiled subplan for CProject($0)[CSelect(($1 = 3))[MemoryScan[CFileScan(public:adhoc:R)]]]\n\nfor (uint64_t i : V2->range()) {\n MaterializedTupleRef_V2_0_1 t_023(V2, i);\n\n if (( (t_023.get(1)) == (3) )) {\n MaterializedTupleRef_V1_0 t_022;\n t_022.set(0, t_023.get(0));\n result.push_back(t_022);\nstd::cout << t_022 << std::endl;\n \n }\n \n } // end scan over V2\n \nstd::cout << \"Evaluating subplan CProject($0)[CSelect(($1 = 3))[MemoryScan[CFileScan(public:adhoc:R)]]]\" << std::endl;\n \n\n\n // return final result\n resultInfo->tuples = A->tuples;\n resultInfo->fields = A->fields;\n resultInfo->relation = A->relation;\n\n}\n\n\n\nint main(int argc, char **argv) {\n\n struct relationInfo resultInfo;\n\n init();\n\n // Execute the query\n query(&resultInfo);\n\n#ifdef ZAPPA\n// printrelation(&resultInfo);\n#endif\n// free(resultInfo.relation);\n}\n"
}
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 13373))
s.send(json.dumps(data))
result = json.loads(s.recv(1024))
print result
s.close()