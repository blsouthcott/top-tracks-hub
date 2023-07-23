import React from "react";

function Modal({ isActive, title, children, onConfirm, onClose }) {
  return (
    <div className={`modal ${isActive ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          {children}
        </section>
        <footer className="modal-card-foot">
          <button className="button is-success" onClick={onConfirm}>Yes</button>
          <button className="button" onClick={onClose}>No</button>
        </footer>
      </div>
    </div>
  );
}

export default Modal;
