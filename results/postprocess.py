import matplotlib.pyplot as plt
import numpy as np
import sys
import json

if len(sys.argv) < 3:
    print('Usage: python3.5 postprocess.py pathToInFile outFIleName')
    exit(1)

data = list()
content = open(sys.argv[1], 'r')
result = json.load(content)

for row in result['data'].split('\n')[:-1]:
    this_row = list()
    for pixels in row.replace('\n', '').split('\t')[:-1]:
        rgba = pixels.split(' ')
        this_row.append([float(e) for e in rgba])
    data.append(this_row)

imgArr = np.array(data).astype(np.uint8)
plt.imsave(sys.argv[2], imgArr)