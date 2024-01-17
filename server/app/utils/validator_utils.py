from marshmallow.fields import Field


class CommaDelimitedStringField(Field):
    def _deserialize(self, value, attr, data, **kwargs):
        return value.split(",")
