import pandas as pd

parquet_path = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\assets\dataset\train-00000-of-00001.parquet'
df = pd.read_parquet(parquet_path)

# Check the first few rows, specifically the length of the 'output' strings
for i, row in df.head(10).iterrows():
    print(f"Row {i} output length: {len(row['output'])}")
    print(f"Row {i} output: {row['output'][:100]}...{row['output'][-50:]}")
    print("-" * 20)
