def row_to_dict(row):
    row_dict = row.__dict__
    row_dict.pop("_sa_instance_state")
    for k in row_dict:
        if row_dict[k] and type(row_dict[k]) not in (str, int):
            row_dict[k] = [val.name for val in row_dict[k]]
    return row_dict
