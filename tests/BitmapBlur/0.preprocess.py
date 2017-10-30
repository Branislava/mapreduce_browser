from scipy import misc
import sys

if len(sys.argv) < 2:
    print('Usage: python3.5 0.preprocess.py 0.data_in')
    exit(1)

image = misc.imread(sys.argv[1])
fout = open('0.data_in.map', 'w')
for row in image:
    ln = ""
    for rgba in row:
        if len(rgba) == 4:
            ln += ' '.join([str(v) for v in rgba[:-1]]) + "\t"
        elif len(rgba) == 3:
            ln += ' '.join([str(v) for v in rgba]) + "\t"
    fout.write(ln + "\n")
fout.close()
