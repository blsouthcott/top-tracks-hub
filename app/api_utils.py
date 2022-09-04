

def row_to_dict(row):
    row_info = {}
    for col in row.__table__.columns:
        row_info[col.name] = getattr(row, col.name)
    return row_info