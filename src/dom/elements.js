const elements = {};

function initElements() {
  const selectors = {
    calendar: '#calendar',
    toggleAdminMode: '#toggleAdminMode',
    loading: '#loading',
    adminControls: '#adminControls',
    timeThresholdInput: '#timeThresholdInput',
    saveThresholdBtn: '#saveThresholdBtn',
    bookingsList: '#bookingsList',
    selectedDateDisplay: '#selectedDateDisplay',
    timeSelect: '#timeSelect',
    serviceSelect: '#serviceSelect',
    bookingForm: '#bookingForm',
    dateDetailsModal: '#dateDetailsModal',
    modalDateTitle: '#modalDateTitle',
    dateBookingsList: '#dateBookingsList',
    bookingModal: '#bookingModal',
    busyTimeModal: '#busyTimeModal'
  };

  Object.keys(selectors).forEach(key => {
    const el = document.querySelector(selectors[key]);
    if (!el) console.error(`Элемент ${selectors[key]} не найден!`);
    elements[key] = el;
  });
}

export { elements, initElements };
