import pandas as pd

print("=== day_ready.pkl ===")
df = pd.read_pickle("day_ready.pkl")
print("Shape:", df.shape)
print("Index type:", type(df.index))
print("Index[:3]:", df.index[:3].tolist())
print("Columns:", df.columns.tolist())

print()
print("=== hour_ready.pkl ===")
hf = pd.read_pickle("hour_ready.pkl")
print("Shape:", hf.shape)
print("Index type:", type(hf.index))
print("Index[:3]:", hf.index[:3].tolist())
print("Columns:", hf.columns.tolist())
