import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export const alert = withReactContent(Swal.mixin({
  confirmButtonColor: '#00D1B2',
}));
