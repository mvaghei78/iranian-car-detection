import pandas as pd
import os

model_names_df = pd.read_csv("cars_model_name.csv")
for i in range(model_names_df.shape[0]):
    model_id = model_names_df.iloc[[i]].model_id.item()
    model_name = model_names_df.iloc[[i]].model_name.item()
    old_dir = os.path.join(os.getcwd(), "images", str(model_id))
    new_dir = os.path.join(os.getcwd(), "images", model_name)
    if os.path.isdir(old_dir):
        os.rename(old_dir, new_dir)
        print('folder with name', str(model_id), 'changed to', model_name)