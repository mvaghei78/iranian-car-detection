import os
import cv2
import tensorflow as tf
from keras import layers
from keras.applications.imagenet_utils import preprocess_input
from keras.models import Model
dataset_path = "/home/rayansoft/PycharmProjects/CarDetectionProject/images/"
img_height = 250
img_width = 250
def remove_not_car_images(model):
  for folder_name in os.listdir(dataset_path):
      path_to_imgs = dataset_path+folder_name+"/"
      removed_count = 0
      print("Processing on images in folder '", folder_name, "' started...")
      for img in os.listdir(path_to_imgs):
        n = cv2.imread(path_to_imgs+img, cv2.IMREAD_UNCHANGED)
        n = cv2.resize(n, (img_height, img_width), interpolation = cv2.INTER_LINEAR)
        n = n.reshape((1, img_height, img_width, 3))
        x = preprocess_input(n)
        prediction = model.predict(x)
        # if label is 1 then it means that was predicted as not_car
        if prediction.argmax() == 1:
          removed_count += 1
          os.remove(path_to_imgs+img)
      print("from class '", folder_name, "'", str(removed_count), "files deleted.")


def build_model():
    base_model = tf.keras.applications.InceptionResNetV2(
        include_top=False,
        weights="imagenet",
        classes=2,
        input_shape=(img_height, img_width, 3)
    )
    x = base_model.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(1024, activation="relu")(x)
    pred = layers.Dense(2, activation="softmax")(x)
    inception_resnet_model = Model(inputs=base_model.input, outputs=pred)

    base_model = tf.keras.applications.InceptionV3(
        include_top=False,
        weights="imagenet",
        classes=2,
        input_shape=(img_height, img_width, 3)
    )
    x = base_model.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(1024, activation="relu")(x)
    pred = layers.Dense(2, activation="softmax")(x)
    inception_v3_model = Model(inputs=base_model.input, outputs=pred)

    base_model = tf.keras.applications.MobileNet(
        include_top=False,
        weights="imagenet",
        classes=2,
        input_shape=(img_height, img_width, 3)
    )
    x = base_model.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(1024, activation="relu")(x)
    pred = layers.Dense(2, activation="softmax")(x)
    mobilenet_model = Model(inputs=base_model.input, outputs=pred)

    models = [inception_resnet_model, inception_v3_model, mobilenet_model]
    model_input = tf.keras.Input(shape=(img_height, img_width, 3))
    model_outputs = [model(model_input) for model in models]
    ensemble_output = tf.keras.layers.Average()(model_outputs)
    ensemble = tf.keras.Model(inputs=model_input, outputs=ensemble_output)
    return ensemble

if __name__ == "__main__":
    ensemble_model = build_model()
    ensemble_model.load_weights("ensemble_model.hdf5")
    remove_not_car_images(ensemble_model)
