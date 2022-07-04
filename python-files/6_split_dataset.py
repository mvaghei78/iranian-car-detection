import os, shutil, random

class SplitDataset:
    def __init__(self, dataset_path, splitted_dataset_path, extension_allowed='.jpg', train_percentage=80, valid_percentage=10):
        self.dataset_path = dataset_path
        self.extension_allowed = extension_allowed
        self.train_percentage = train_percentage
        self.valid_percentage = valid_percentage
        if not os.path.isdir(splitted_dataset_path):
            os.mkdir(splitted_dataset_path)
        self.splitted_dataset_path = splitted_dataset_path
        self.dataset_directories()
        self.partition_dataset()
        print("splitting dataset finished.")

    def dataset_directories(self):
        for partition in ['training', 'validation', 'test']:
            partition_path = self.splitted_dataset_path + partition + '/'
            if os.path.exists(partition_path):
              shutil.rmtree(partition_path)
            os.mkdir(partition_path)
            os.mkdir(partition_path+'images/')
            os.mkdir(partition_path+'labels/')

    def partition_dataset(self):
        ext_len = len(self.extension_allowed)
        for folder_name in os.listdir(self.dataset_path):
            path_to_imgs = self.dataset_path + folder_name + '/'
            if os.path.isdir(path_to_imgs):
                files = []
                if os.path.isdir(path_to_imgs) and folder_name not in ['training', 'validation', 'test']:
                    for img in os.listdir(path_to_imgs):
                        if img.endswith(self.extension_allowed):
                            strip = img[0:len(img) - ext_len]
                            files.append(path_to_imgs + strip)
                    random.shuffle(files)
                    size = len(files)
                    train_split = int(self.train_percentage * size / 100)
                    valid_split = int(self.valid_percentage * size / 100)
                    test_split = size - (train_split + valid_split)
                    print('splitting folder', folder_name, 'started...')
                    self.copy_files(self.splitted_dataset_path+'training/images/', self.splitted_dataset_path+'training/labels/', train_split, files)
                    self.copy_files(self.splitted_dataset_path+'validation/images/', self.splitted_dataset_path+'validation/labels/', valid_split, files)
                    self.copy_files(self.splitted_dataset_path+'test/images/', self.splitted_dataset_path+'test/labels/', test_split, files)
                    print('splitting folder', folder_name, 'finished.')

    def copy_files(self, images_path, labels_path, split_size, files_path):
        for i in range(split_size):
            strip = files_path[i]
            image_file = strip + self.extension_allowed
            annotation_file = strip + '.txt'
            if os.path.exists(image_file) and os.path.exists(annotation_file):
              shutil.copy(image_file, images_path)
              shutil.copy(annotation_file, labels_path)

if __name__ == '__main__':
    dataset_path = '/home/rayansoft/PycharmProjects/CarDetectionProject/images/'
    splitted_dataset_path = '/home/rayansoft/PycharmProjects/CarDetectionProject/Splitted_Dataset/'
    SplitDataset(dataset_path, splitted_dataset_path, train_percentage=70, valid_percentage=20)

# import os, shutil, random
#
# class SplitDataset:
#     def __init__(self, dataset_path, extension_allowed='.jpg', train_percentage=80, valid_percentage=10):
#         self.dataset_path = dataset_path
#         self.extension_allowed = extension_allowed
#         self.train_percentage = train_percentage
#         self.valid_percentage = valid_percentage
#         self.dataset_directories()
#         self.partition_dataset()
#         print("splitting dataset finished.")
#
#     def dataset_directories(self):
#         self.images_path = self.dataset_path + 'images/'
#         if os.path.exists(self.images_path):
#             shutil.rmtree(self.images_path)
#         os.mkdir(self.images_path)
#         self.labels_path = self.dataset_path + 'labels/'
#         if os.path.exists(self.labels_path):
#             shutil.rmtree(self.labels_path)
#         os.mkdir(self.labels_path)
#         for partition in ['training', 'validation', 'test']:
#             partition_images_path = self.images_path + partition + '/'
#             partition_labels_path = self.labels_path + partition + '/'
#             os.mkdir(partition_images_path)
#             os.mkdir(partition_labels_path)
#
#     def partition_dataset(self):
#         ext_len = len(self.extension_allowed)
#         for folder_name in os.listdir(self.dataset_path):
#             path_to_imgs = self.dataset_path + folder_name + '/'
#             files = []
#             if os.path.isdir(path_to_imgs) and folder_name != 'images' and folder_name != 'labels':
#                 for img in os.listdir(path_to_imgs):
#                     if img.endswith(self.extension_allowed):
#                         strip = img[0:len(img) - ext_len]
#                         files.append(path_to_imgs + strip)
#                 random.shuffle(files)
#                 size = len(files)
#                 train_split = int(self.train_percentage * size / 100)
#                 valid_split = int(self.valid_percentage * size / 100)
#                 test_split = size - (train_split + valid_split)
#                 self.copy_files(self.images_path+'training/', self.labels_path+'training/', train_split, files)
#                 self.copy_files(self.images_path+'validation/', self.labels_path+'validation/', valid_split, files)
#                 self.copy_files(self.images_path+'test/', self.labels_path+'test/', test_split, files)
#
#     def copy_files(self, images_path, labels_path, split_size, files_path):
#         for i in range(split_size):
#             strip = files_path[i]
#             image_file = strip + self.extension_allowed
#             shutil.copy(image_file, images_path)
#             annotation_file = strip + '.txt'
#             shutil.copy(annotation_file, labels_path)
#
#
# if __name__ == '__main__':
#     dataset_path = '/home/rayansoft/PycharmProjects/CarDetectionProject/Dataset/'
#     SplitDataset(dataset_path, train_percentage=70, valid_percentage=20)