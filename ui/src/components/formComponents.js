import React from "react";
import { styles, toClassName } from "./styles";

export const Field = ({ labelName, fieldType, fieldVal, placeholderText, onChange, requiredField }) => (
  <div className={toClassName(styles.field, styles.isFullWidth)}>
    <label className={styles.label}>{labelName}</label>
    <div className={styles.control}>
      <input
        className={styles.input}
        type={fieldType}
        value={fieldVal}
        placeholder={placeholderText}
        onChange={onChange}
        required={requiredField || undefined}
      />
    </div>
  </div>
)


export const SubmitButton = ({ title }) => (
  <div className={styles.control}>
    <button type="submit" className={toClassName(styles.button, styles.isPrimary, styles.isFullWidth)}>
      {title}
    </button>
  </div>
)