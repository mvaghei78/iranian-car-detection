import os
from gluoncv import model_zoo, data, utils
import pandas as pd
import cv2
class LabellingDataset:
  def labelling_on_dataset(self, model, dataset_path):
    for folder_name in os.listdir(dataset_path):
      path_to_imgs = dataset_path+folder_name+"/"
      if os.path.isdir(path_to_imgs) and not os.path.exists(dataset_path+folder_name+"_df.csv"):
        print("labelling on images in folder '" + folder_name + "' started...")
        data_frame = pd.DataFrame(columns=["file_path", "file_name", "img_width", "img_height", "top_left_x1", "top_left_y1", "bottom_right_x2", "bottom_right_y2", "class_name"])
        for img_name in os.listdir(path_to_imgs):
          img_path = path_to_imgs + img_name
          x, orig_img = data.transforms.presets.ssd.load_test(img_path, short=300)
          img = cv2.imread(img_path)
          box_ids, scores, bboxes = model(x)
          best_scores, best_bboxes = self.get_best_bboxes(box_ids, scores, bboxes, 0.8)
          best_index = self.find_biggest_bbox(best_scores, best_bboxes)
          if best_index != -1:
            best_bboxes = bboxes[0][best_index].asnumpy()
            best_bboxes = [self.convert_scale(best_bboxes[0], orig_img.shape[1], img.shape[1]),
                           self.convert_scale(best_bboxes[1], orig_img.shape[0], img.shape[0]),
                           self.convert_scale(best_bboxes[2], orig_img.shape[1], img.shape[1]),
                           self.convert_scale(best_bboxes[3], orig_img.shape[0], img.shape[0])]
            best_bboxes = self.standardize_bbox(best_bboxes, img.shape[0], img.shape[1])
            data_frame.loc[len(data_frame.index)] = [img_path, img_name, img.shape[1], img.shape[0], best_bboxes[0], best_bboxes[1],
                                                            best_bboxes[2], best_bboxes[3], folder_name]
          else:
            # there is no bbox for image
            os.remove(img_path)
        data_frame.to_csv(dataset_path+folder_name+'_df.csv', index=False)
        print("labelling on images in folder '"+folder_name+"' finished.")
      elif os.path.exists(dataset_path+folder_name+"_df.csv"):
        print("images in folder '"+path_to_imgs+"' was labelled before.")

  def get_best_bboxes(self, box_ids, scores, bboxes, threshold=0.98):
    best_scores = []
    best_bboxes = []
    for i in range(100):
      if box_ids[0][i] == net.classes.index("car") and scores[0][i] > threshold:
        best_scores.append(scores[0][i].asnumpy().tolist()[0])
        best_bboxes.append(bboxes[0][i].asnumpy().tolist())
    return best_scores, best_bboxes

  def find_biggest_bbox(self, scores, bboxes):
    best_index = -1
    best_area = -1
    index = 0
    for bbox in bboxes:
      width = bbox[2]-bbox[0]
      height = bbox[3]-bbox[1]
      area = width * height
      if area >= best_area:
        best_index = index
        best_area = area
      index += 1
    return best_index

  def standardize_bbox(self, bbox, height, width):
    for i in range(len(bbox)):
      if bbox[i] < 0:
        bbox[i] = 0
    if bbox[0] >= width:
      bbox[0] = width-1
    if bbox[2] >= width:
      bbox[2] = width-1
    if bbox[1] >= height:
      bbox[1] = height-1
    if bbox[3] >= height:
      bbox[3] = height-1
    return bbox

  def convert_scale(self, old_num, old_range, new_range):
    new_num = old_num / old_range * new_range
    return new_num

if __name__ == "__main__":
  net = model_zoo.get_model('ssd_512_resnet50_v1_voc', pretrained=True)
  dataset_path = "/home/rayansoft/PycharmProjects/CarDetectionProject/images/"
  LabellingDataset().labelling_on_dataset(net, dataset_path)