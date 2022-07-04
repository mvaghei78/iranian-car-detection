import os
import matplotlib.pyplot as plt
import shutil
dataset_path = "/home/rayansoft/PycharmProjects/Complete_Dataset/images/"
data = dict()
for folder_name in os.listdir(dataset_path):
    # print(folder_name)
    count = 0
    for img in os.listdir(dataset_path+folder_name+'/'):
        if os.path.isfile(os.path.join(dataset_path, folder_name, img)) and img.endswith('.jpg'):
            count += 1
    # if count >= 500:
    data[folder_name] = count
    # else:
    #     shutil.rmtree(dataset_path+folder_name+'/')
print(data)
# names = list(data.keys())
# values = list(data.values())
# plt.bar(range(len(data)), values, tick_label=names)
# plt.show()