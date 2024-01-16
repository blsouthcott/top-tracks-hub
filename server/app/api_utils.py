from datetime import date


def row_to_dict(row):
    row_dict = {}
    for key in row.__dict__:
        if key == "_sa_instance_state":
            continue
        val = row.__dict__[key]
        if val and type(val) not in (str, int, date):
            row_dict[key] = [val.name for val in row.__dict__[key]]
        elif val and type(val) is date:
            row_dict[key] = val.strftime("%Y-%m-%d")
        else:
            row_dict[key] = val
    return row_dict
