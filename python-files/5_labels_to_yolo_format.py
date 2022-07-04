import os
import pandas as pd
class LabelConversion:
    def __init__(self, dataset_path):
        class_names = []
        class_id = 0
        for folder_name in os.listdir(dataset_path):
            if os.path.isdir(dataset_path+folder_name):
                print("Creating label files for images in folder'", folder_name, "' started...")
                class_names.append(folder_name)
                cars_label_df = pd.read_csv(dataset_path + folder_name + '_df.csv')
                for i in range(cars_label_df.shape[0]):
                    row = cars_label_df.iloc[i]
                    x_center, y_center, width, height = self.convert_annotation(row)
                    label_string = self.create_label_string(class_id, x_center, y_center, width, height)
                    self.create_label_file(dataset_path+folder_name+'/', row['file_name'], label_string)
                class_id += 1
                print("Label files for images in folder'", folder_name, "' created")
        self.classes_array_file(dataset_path+'classes.txt', class_names)

    def convert_annotation(self, coordinates):
        # we should get the value of center point and width and height of bbox and normalize them
        x_center = (coordinates['top_left_x1']+coordinates['bottom_right_x2'])/2
        x_center /= float(coordinates['img_width'])
        y_center = (coordinates['top_left_y1']+coordinates['bottom_right_y2'])/2
        y_center /= float(coordinates['img_height'])
        width = (coordinates['bottom_right_x2']-coordinates['top_left_x1'])/float(coordinates['img_width'])
        height = (coordinates['bottom_right_y2']-coordinates['top_left_y1'])/float(coordinates['img_height'])
        return x_center, y_center, width, height

    def create_label_string(self, class_id, x_center, y_center, width, height):
        label_string = ' '
        label_string = label_string.join([str(class_id), "{:.6f}".format(x_center), "{:.6f}".format(y_center), "{:.6f}".format(width), "{:.6f}".format(height)])
        return label_string

    def create_label_file(self, img_path, img_name, label_string):
      if not os.path.exists(img_path + img_name.replace('jpg', 'txt')):
        label_file = open(img_path + img_name.replace('jpg', 'txt'), "w")
        label_file.write(label_string)
        label_file.close()

    def classes_array_file(self, file_path, classes_dict):
        with open(file_path, 'w') as fp:
            fp.write(str(classes_dict))

if __name__ == '__main__':
    LabelConversion('/home/rayansoft/PycharmProjects/CarDetectionProject/images/')