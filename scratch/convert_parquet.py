import pandas as pd
import json
import os

parquet_path = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\assets\dataset\train-00000-of-00001.parquet'
output_json = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\assets\dataset\fitness_dataset.json'

if os.path.exists(parquet_path):
    df = pd.read_parquet(parquet_path)
    # Get a sample or the whole thing if it's small
    print(f"Columns: {df.columns.tolist()}")
    print(f"Shape: {df.shape}")
    
    # Save to JSON (orient='records' is usually best for JS)
    df.to_json(output_json, orient='records', indent=2)
    print(f"Successfully converted to {output_json}")
else:
    print(f"File not found: {parquet_path}")
