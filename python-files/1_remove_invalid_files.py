import os
import PIL
from PIL import Image
def delete_invalid_files(dataset_path):
  for folder_name in os.listdir(dataset_path):
    path_to_imgs = dataset_path+folder_name+"/"
    print("processing of folder '"+path_to_imgs+"' started...")
    removed_count = 0
    for file_name in os.listdir(path_to_imgs):
      try:
        img = Image.open(path_to_imgs+file_name)
        img.verify()  # verify that it is, in fact an image
      except PIL.UnidentifiedImageError:
        os.remove(path_to_imgs+file_name)
        removed_count += 1
        print("invalid file in path '"+path_to_imgs+file_name+"' deleted.")
    print("folder '"+path_to_imgs+"' completely checked out and", removed_count, "images deleted.")
    print("_________________________________________________________________________")

if __name__ == "__main__":
    dataset_path = "/home/rayansoft/PycharmProjects/CarDetectionProject/images/"
    delete_invalid_files(dataset_path)
