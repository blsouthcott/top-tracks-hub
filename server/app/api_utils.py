from datetime import date

def row_to_dict(row):
    row_dict = row.__dict__
    row_dict.pop("_sa_instance_state")
    for key in row_dict:
        if row_dict[key] and type(row_dict[key]) not in (str, int, date):
            row_dict[key] = [val.name for val in row_dict[key]]
        elif row_dict[key] and type(row_dict[key]) is date:
            row_dict[key] = row_dict[key].strftime("%Y-%m-%d")
    return row_dict
