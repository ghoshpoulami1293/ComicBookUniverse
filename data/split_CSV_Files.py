import pandas as pd
import csv

# Preprocess fields
def clean_field(x):
    if pd.isnull(x):
        return ''
    x = str(x)
    for ch in ['"', "'", '\\', '/', ',']:
        x = x.replace(ch, '')
    return x.strip()

# Load the two CSVs
dc = pd.read_csv('dc-wikia-data.csv')
marvel = pd.read_csv('marvel-wikia-data.csv')

# Fix DC Eye Color error in dataset
dc['EYE'] = dc['EYE'].replace('Auburn Hair', 'Auburn Eyes')

# Add universe column
dc['universe'] = 'DC'
marvel['universe'] = 'Marvel'

# Drop 'page_id' and 'urlslug'columns
dc = dc.drop(columns=['page_id', 'urlslug'])
marvel = marvel.drop(columns=['page_id', 'urlslug'])

# Combine the datasets
data = pd.concat([dc, marvel], ignore_index=True)

# Preprocess text columns
text_columns = ['name', 'ID', 'ALIGN', 'EYE', 'HAIR', 'SEX', 'GSM', 'ALIVE']
for col in text_columns:
    if col in data.columns:
        data[col] = data[col].apply(clean_field)

# Replacement for GSM missing
data['GSM'] = data['GSM'].replace('', 'Heterosexual Characters')

# Replacement for EyeColor and HairColor
data['EYE'] = data['EYE'].replace('', 'Black Eyes')
data['EYE'] = data['EYE'].fillna('Black Eyes')

data['HAIR'] = data['HAIR'].replace('', 'Brown Hair')
data['HAIR'] = data['HAIR'].fillna('Brown Hair')

# Replace remaining columns with mode
for col in ['ALIGN', 'SEX', 'ALIVE', 'YEAR']:
    if col in data.columns:
        mode_value = data[col].mode()[0]
        data[col] = data[col].replace('', mode_value)
        data[col] = data[col].fillna(mode_value)

# Assign character_id
data['character_id'] = range(1, len(data) + 1)

# Map Universe Name to Universe ID
universe_mapping = {'Marvel': 1, 'DC': 2}
data['universe_id'] = data['universe'].map(universe_mapping)

# Create lookup tables and mappings
def create_lookup_and_map(df, column_name, id_name, new_col_name):
    unique_values = sorted(df[column_name].dropna().unique())
    lookup_df = pd.DataFrame({
        id_name: range(1, len(unique_values) + 1),
        new_col_name: unique_values
    })
    mapping = dict(zip(unique_values, lookup_df[id_name]))
    return lookup_df, mapping

# Create lookup DataFrames and mappings
alignment_df, alignment_map = create_lookup_and_map(data, 'ALIGN', 'alignment_id', 'align_name')
eye_color_df, eye_color_map = create_lookup_and_map(data, 'EYE', 'eye_color_id', 'eye_name')
hair_color_df, hair_color_map = create_lookup_and_map(data, 'HAIR', 'hair_color_id', 'hair_name')
sex_df, sex_map = create_lookup_and_map(data, 'SEX', 'sex_id', 'sex_name')
gsm_df, gsm_map = create_lookup_and_map(data, 'GSM', 'gsm_id', 'gsm_name')

# Map IDs into the main data DataFrame
data['alignment_id'] = data['ALIGN'].map(alignment_map)
data['eye_color_id'] = data['EYE'].map(eye_color_map)
data['hair_color_id'] = data['HAIR'].map(hair_color_map)
data['sex_id'] = data['SEX'].map(sex_map)
data['gsm_id'] = data['GSM'].map(gsm_map)

# Save Universe.csv
universe_df = pd.DataFrame({
    'universe_id': [1, 2],
    'name': ['Marvel', 'DC']
})
universe_df.to_csv('Universe.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')

# Save lookup tables
alignment_df.to_csv('Alignment.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')
eye_color_df.to_csv('EyeColor.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')
hair_color_df.to_csv('HairColor.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')
sex_df.to_csv('Sex.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')
gsm_df.to_csv('GSM.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')

# Create combined_heroes.csv
combined = data[['character_id', 'name', 'ID', 'alignment_id', 'eye_color_id', 'hair_color_id', 'sex_id', 'gsm_id', 'ALIVE', 'APPEARANCES', 'universe_id', 'YEAR']].copy()
combined.rename(columns={
    'ID': 'secret_identity',
    'ALIVE': 'alive',
    'APPEARANCES': 'appearances',
    'YEAR': 'first_appearance_year'
}, inplace=True)
combined.to_csv('combined_heroes.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')

# Create Characters.csv
characters = data[['character_id', 'name', 'universe_id', 'ALIVE', 'APPEARANCES', 'YEAR']].copy()
characters.rename(columns={
    'ALIVE': 'alive',
    'APPEARANCES': 'appearances',
    'YEAR': 'first_appearance_year'
}, inplace=True)
characters.to_csv('Characters.csv', index=False, quoting=csv.QUOTE_MINIMAL, escapechar='\\')

print(" All CSVs generated successfully: Universe, Characters, Alignment, EyeColor, HairColor, Sex, GSM, Combined Heroes.")
