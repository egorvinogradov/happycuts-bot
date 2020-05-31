import * as MESSAGES from './messages.js';

export class HappyCutsBot {

  YANDEX_API_URL = 'https://geocode-maps.yandex.ru/1.x/?';
  YANDEX_API_KEY = '12138992-f270-44ce-bf45-3e42cab2bc3f';

  USER_SCHEME = {
    userId: null,
    stage: null,
    phoneNumber: null,
    firstName: null,
    lastName: null,
    addressRaw: null,
    addressNormalized: null,
    addressLat: null,
    addressLng: null,
    addressComment: null,
    isUnsubscribed: false,
    ongoingOrderServiceType: null,
    ongoingOrderEmployeeId: null,
    ongoingOrderEmployeeMinutesToCome: null,
    ongoingFeedbackScore: null,
    ongoingFeedbackText: null,
    hasRequestedServices: {
      haircut: false,
      coloring: false,
      manicure: false,
      pedicure: false,
    },
    hasRequestedOutOfAreaAddress: null,
  };

  STAGES = {
    SELECT_SERVICE: 'SELECT_SERVICE',
    ENTER_PHONE: 'ENTER_PHONE',
    ENTER_ADDRESS: 'ENTER_ADDRESS',
    STARTED_SEARCHING_EMPLOYEES: 'STARTED_SEARCHING_EMPLOYEES',
    EMPLOYEE_FOUND_ENTER_APT_NUM: 'EMPLOYEE_FOUND_ENTER_APT_NUM',
    PROVIDE_FEEDBACK: 'PROVIDE_FEEDBACK',
  };

  SERVICE_TYPES = [
    'haircut',
    'coloring',
    'manicure',
    'pedicure',
  ];

  // TODO: make async
  getUserDataById = (userId) => {
    const defaultData = { ...this.USER_SCHEME };
    defaultData.userId = userId;
    defaultData.stage = this.STAGES.SELECT_SERVICE;

    let data;
    try {
      data = JSON.parse(localStorage.getItem(userId));
    }
    catch (e) {}
    return data && Object.keys(data).length ? data : defaultData;
  };

  // TODO: change in production
  sendMessage = (userId, textArray, imageUrl) => {

    return textArray.toString();

    if (this.messageCallback) {
      setTimeout(() => {
        if (imageUrl) {
          this.messageCallback(userId, '', imageUrl);
        }
        else if (typeof textArray === 'string') {
          this.messageCallback(userId, textArray);
        }
        else if (textArray && textArray.length) {
          textArray.forEach((text, i) => {
            setTimeout(() => {
              this.messageCallback(userId, text);
            }, i * 800);
          });
        }
      }, 1000);
    }
  };

  sendStartMessage = (userId) => {
    this.sendMessage(userId, MESSAGES.MESSAGE_SELECT_SERVICE_START);
  };

  // TODO: change in production
  subscribeToBotMessages = (callback) => {
    this.messageCallback = callback;
  };

  getDictionaryResponse = (userId, text, dict) => {
    for (let i = 0; i < dict.length; i++) {
      const keywords = dict[i].keywords;

      for (let j = 0; j < keywords.length; j++) {
        if (text.toLowerCase().includes( keywords[j] )) {

          const response = dict[i];
          if (response.callback) {
            return response.callback();
          }
          else {
            return response.text;
          }
        }
      }
    }
  };

  findGlobalDictionaryResponse = (userId, text) => {
    return this.getDictionaryResponse(userId, text, [
      {
        keywords: ['цены', 'цена', 'стоимость', 'сколько стоит'],
        text: MESSAGES.MESSAGE_DICTIONARY_PRICING,
      },
      {
        keywords: ['коронавирус', 'вирус', 'карантин'],
        text: MESSAGES.MESSAGE_DICTIONARY_COVID,
      },
      {
        keywords: ['человек', 'оператор', 'поддержка', 'телефон', 'позвонить', 'перезвоните'],
        text: MESSAGES.MESSAGE_DICTIONARY_SUPPORT,
      },
      {
        keywords: ['заново', 'сначала', 'еще раз'],
        callback: () => {
          this.updateUserData(userId, {
            ...this.USER_SCHEME,
            stage: this.STAGES.SELECT_SERVICE,
            userId,
          });
          return MESSAGES.MESSAGE_SELECT_SERVICE_START;
        },
      },
      {
        keywords: ['стоп', 'stop', 'отписаться', 'unsubscribe'],
        callback: () => {
          this.updateUserData(userId, { isUnsubscribed: true });
          return MESSAGES.MESSAGE_UNSUBSCRIBE;
        },
      },
    ]);
  };

  handleBackendTrigger = (userId, type, data) => {
    if (type === 'employeeFound') {
      const { employee, waitTimeMinutes } = data;
      const { id, firstName, lastName, gender, photoUrl } = employee;
      this.updateUserData(userId, {
        stage: this.STAGES.EMPLOYEE_FOUND_ENTER_APT_NUM,
        ongoingOrderEmployeeId: id,
        ongoingOrderEmployeeMinutesToCome: waitTimeMinutes,
      });
      const { addressNormalized, phoneNumber } = this.getUserDataById(userId);
      this.sendMessage(userId, template(MESSAGES.MESSAGE_EMPLOYEE_FOUND, {
        addressNormalized,
        firstName,
        phoneNumber,
        fullName: firstName + ' ' + lastName,
        waitTimeString: inflect(waitTimeMinutes, ['минута', 'минуты', 'минут']),
        pronoun: gender === 'male' ? 'Он' : 'Она',
      }));
      this.sendMessage(userId, null, photoUrl);
    }
    setTimeout(() => {
      this.sendMessage(userId, MESSAGES.MESSAGE_EMPLOYEE_FOUND_ENTER_APT_NUM);
    }, 3000);
  };

  handleUserMessage = (userId, text) => {
    const userData = this.getUserDataById(userId);
    const globalResponse = this.findGlobalDictionaryResponse(userId, text);

    if (globalResponse) {
      this.sendMessage(userId, globalResponse);
    }
    else if (userData.stage === this.STAGES.SELECT_SERVICE) {
      this.handleSelectService(userId, text);
    }
    else if (userData.stage === this.STAGES.ENTER_PHONE) {
      this.handleEnterPhone(userId, text);
    }
    else if (userData.stage === this.STAGES.ENTER_ADDRESS) {
      this.handleEnterAddress(userId, text);
    }
    else if (userData.stage === this.STAGES.EMPLOYEE_FOUND_ENTER_APT_NUM) {
      this.handleEnterAptNum(userId, text);
    }
    else {
      this.sendMessage(userId, MESSAGES.MESSAGE_UNKNOWN_ERROR);
    }
  };

  handleEnterAptNum = (userId, addressComment) => {
    this.updateUserData(userId, {
      stage: this.STAGES.PROVIDE_FEEDBACK,
      addressComment,
    });
    this.sendMessage(userId, 'Спасибо, это будет переслано мастеру');
  };

  handleEnterAddress = (userId, text) => {
    this.checkClientAddress(userId, text)
      .then(data => {
        const { addressNormalized, addressLat, addressLng, isWithinDistrict } = data;
        this.updateUserData(userId, {
          addressNormalized,
          addressLat,
          addressLng,
        });
        if (addressNormalized && isWithinDistrict) {
          this.updateUserData(userId, { stage: this.STAGES.STARTED_SEARCHING_EMPLOYEES });
          this.sendMessage(userId, template(MESSAGES.MESSAGE_STARTED_SEARCHING_EMPLOYEES, { addressNormalized }));
        }
        else if (addressNormalized && !isWithinDistrict) {
          this.sendMessage(userId, MESSAGES.MESSAGE_ENTER_ADDRESS_OUT_OF_AREA);
        }
        else {
          this.sendMessage(userId, MESSAGES.MESSAGE_ENTER_ADDRESS_MALFORMED);
        }
      })
      .catch(() => {
        this.sendMessage(userId, MESSAGES.MESSAGE_UNKNOWN_ERROR);
      });
  };

  checkClientAddress = (userId, addressRaw) => {
    const targetDistrict = 'Центральный административный округ';
    return this.yandexGetAddressData(addressRaw)
      .then(address => {
        const { addressLat, addressLng } = address;
        return this.yandexAreCoordsWithinDistrict(addressLat, addressLng, targetDistrict)
          .then(isWithinDistrict => {
            return { ...address, isWithinDistrict };
          })
          .catch(() => {
            return { ...address, isWithinDistrict: false };
          });
      })
      .catch(() => {
        return {
          addressNormalized: null,
          addressLat: null,
          addressLng: null,
          isWithinDistrict: false,
        };
      });
  };

  yandexGetAddressData = (addressRaw) => {
    const apiUrl = this.YANDEX_API_URL + makeQueryString({
      apikey: this.YANDEX_API_KEY,
      geocode: 'Москва ' + addressRaw,
      format: 'json',
      results: 1,
    });
    return fetch(apiUrl)
      .then(response => response.json())
      .then(response => {
        const addressNormalized = response
          ['response']
          ['GeoObjectCollection']
          ['featureMember'][0]
          ['GeoObject']
          ['name'];
        const latLngArr = response
          ['response']
          ['GeoObjectCollection']
          ['featureMember'][0]
          ['GeoObject']
          ['Point']
          ['pos']
          .split(/\s+/);
        if (addressNormalized === 'Москва') {
          throw '';
        }
        const addressLat = latLngArr[0];
        const addressLng = latLngArr[1];
        return {
          addressNormalized,
          addressLat,
          addressLng,
        };
      });
  };

  yandexAreCoordsWithinDistrict = (lat, lng, districtName) => {
    const apiUrl = this.YANDEX_API_URL + makeQueryString({
      apikey: this.YANDEX_API_KEY,
      geocode: [lat, lng].join(','),
      kind: 'district',
      format: 'json',
      results: 1,
    });
    return fetch(apiUrl)
      .then(response => response.json())
      .then(response => {
        let isWithinDistrict = false;
        try {
          const districts = response
            ['response']
            ['GeoObjectCollection']
            ['featureMember'][0]
            ['GeoObject']
            ['metaDataProperty']
            ['GeocoderMetaData']
            ['Address']
            ['Components'];
          isWithinDistrict = districts.filter(district => district.name === districtName).length;
        }
        catch (e) {}
        return isWithinDistrict;
      });
  };

  handleEnterPhone = (userId, text) => {
    let formattedPhone = text.trim().replace(/^8/, '7').replace(/[^\d]/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '7' + formattedPhone;
    }
    const isValid = formattedPhone.length >= 11;
    if (isValid) {
      this.updateUserData(userId, {
        stage: this.STAGES.ENTER_ADDRESS,
        phoneNumber: '+' + formattedPhone,
      });
      this.sendMessage(userId, MESSAGES.MESSAGE_ENTER_ADDRESS);
    }
    else {
      this.sendMessage(userId, MESSAGES.MESSAGE_ENTER_PHONE_ERROR);
    }
  };

  handleSelectService = (userId, text) => {
    const responseText = this.getDictionaryResponse(userId, text, [
      {
        keywords: ['1', 'стрижка', 'парикмахер', 'волосы'],
        callback: () => {
          const userData = this.getUserDataById(userId);
          const hasRequestedServices = {
            ...userData.hasRequestedServices,
            haircut: getTimestamp(),
          };
          this.updateUserData(userId, {
            stage: this.STAGES.ENTER_PHONE,
            ongoingOrderServiceType: this.SERVICE_TYPES[0],
            hasRequestedServices,
          });
          return [
            MESSAGES.MESSAGE_SELECT_SERVICE_HAIRCUT,
            MESSAGES.MESSAGE_ENTER_PHONE,
          ];
        },
      },
      {
        keywords: ['2', 'окрашивание', 'покраска', 'тонирование'],
        callback: () => this.handleNotSupportedService(userId, 'coloring'),
      },
      {
        keywords: ['3', 'маникюр', 'ногти'],
        callback: () => this.handleNotSupportedService(userId, 'manicure'),
      },
      {
        keywords: ['4', 'педикюр'],
        callback: () => this.handleNotSupportedService(userId, 'pedicure'),
      },
    ]);
    this.sendMessage(userId, responseText);
  };

  handleNotSupportedService = (userId, serviceType) => {
    const userData = this.getUserDataById(userId);
    const hasRequestedServices = {
      ...userData.hasRequestedServices,
      [serviceType]: getTimestamp(),
    };
    this.updateUserData(userId, { hasRequestedServices });
    return MESSAGES.MESSAGE_SELECT_SERVICE_NOT_PROVIDED_YET;
  };


  // TODO: make async
  updateUserData = (userId, diff) => {
    const currentData = this.getUserDataById(userId);
    const updatedData = { ...currentData, ...diff };
    localStorage.setItem(userId, JSON.stringify(updatedData));
  };
}
