import matplotlib.pyplot as plt
import numpy as np

filter = np.zeros((3, 3))
filter[-1][-1] = -1
filter[-1][0] = -1
filter[-1][1] = -1
filter[0][-1] = -1
filter[0][0] = 10
filter[0][1] = -1
filter[1][-1] = -1
filter[1][0] = -1
filter[1][1] = -1

lines = open('0.data_in.map', 'r').read().split('\n')

N = len(lines) - 1
M = len(lines[0].split('\t'))
matrix = np.zeros((N, M, 3))

for i in range(N):
    pixels = lines[i].split('\t')
    for j in range(M):
        pixel = pixels[j].split(' ')
        if len(pixel) == 3:
            matrix[i][j][0], matrix[i][j][1], matrix[i][j][2] = int(pixel[0]), int(pixel[1]), int(pixel[2])
     
new_matrix = np.zeros((N, M, 3))

for i in range(N):
    for j in range(M):

        sum_r, sum_g, sum_b = 0, 0, 0
        for ro in [-1, 0, 1]:
            for co in [-1, 0, 1]:
                if (i + ro) in range(0, N) and (j + co) in range(0, M):
                    sum_r += matrix[i+ro][j+co][0] * filter[ro][co]
                    sum_g += matrix[i+ro][j+co][1] * filter[ro][co]
                    sum_b += matrix[i+ro][j+co][2] * filter[ro][co]
                    
                    
        if sum_r != 0 or sum_g != 0 or sum_b != 0:
            new_matrix[i][j][0] = sum_r
            new_matrix[i][j][1] = sum_g
            new_matrix[i][j][2] = sum_b
            
            if new_matrix[i][j][0] > 255:
                new_matrix[i][j][0] = 255
            if new_matrix[i][j][0] < 0:
                new_matrix[i][j][0] = 0
            
            if new_matrix[i][j][1] > 255:
                new_matrix[i][j][1] = 255
            if new_matrix[i][j][1] < 0:
                new_matrix[i][j][1] = 0
                
            if new_matrix[i][j][2] > 255:
                new_matrix[i][j][2] = 255
            if new_matrix[i][j][2] < 0:
                new_matrix[i][j][2] = 0
    
imgArr = np.array(new_matrix).astype(np.uint8)
plt.imsave('data_out', imgArr)    
