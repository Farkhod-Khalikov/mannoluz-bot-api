import i18next from "i18next";

i18next.init({
  lng: "ru-Ru", // Default language
  resources: {
    "en-US": {
      translation: {
        request_status_update:
          "Your request status is updated to 'Not Active'. If admins didnt contact you, please repeat the request or contact  us through panel 'Contact Us'",
        request_saved: "Your request is saved!",
        btn_list_requests: "Requests List",
        confirm_purchase_request:
          "Please, confirm if you want to leave a request.",
        yes_sure: "Yes, sure",
        no_thanks: "No, thanks",
        admin_removed_notification:
          "You've been removed with admin's privileges. Please, restart bot with /start command",
        admin_granted_notification:
          "You've been provided with admin's privileges. Pleaes, restart bot with /start command",
        purchase_request_cancelled: "❌Request cancelled",
        write_comment: "Please leave a comment:",
        last_transactions: "Last Transactions",
        btn_rules: "Rules",
        btn_list_transactions: "List Transactions",
        coins: "Coins",
        prev: "⬅️prev",
        next: "next➡️",
        description: "Description",
        bonuses_addition: "Add",
        bonuses_removal: "Remove",
        transaction_date: "Transaction Date",
        provide_post_title: "Post Title:",
        provide_post_message: "Post Message:",
        confirm_button: "✅Confirm",
        post_sent: "✅Succesfully send",
        registration_on_start: "Register ME",
        send_post_button: "✍️Send Post",
        btn_list_products: "🛒Products",
        balance_caption: "Your balance",
        purchase_request: "Leave the Request",
        choose_option: "Menu",
        choose_language:
          "🇺🇸Please choose your language.\n🇷🇺Пожалуйста, выберите свой язык.",
        share_contact: "📱Please share your contact.",
        share_contact_button: "📱Share Contact",
        contact_saved: "✅Contact saved successfully.",
        credit_card_button: "💳Get My Credit Card",
        settings_button: "⚙️Settings",
        settings_menu_prompt: "⚙️Please choose settings to update",
        change_language_button: "🌐Change System Language",
        contact_us_button: "📞Contact Us",
        post_creation_cancelled: "❌Post NOT send.",
        btn_cancel_post_creation: "❌Cancel",
        language_changed: "✅Language's changed successfully.",
        active_request_exist:
          "You have active request! Please, wait until admins contact you. We apologize for delay and provided inconvenience.",
        contact_us_information: `Our contacts:

Tashkent: 100002, 
phone: +998-99-011-98-94, +998-93-397-35-72.

Fergana Valley: 150100, 
phone: +998-94-718-54-45.

Southwest: 140100, 
phone: +998-94-718-54-45.

Mail: info@mannol.uz, Mannoloilsale@mail.ru.

Website: mannol.uz .`,
        back_button: "🔙Go Back",
        about_us_button: "📃About Us",
        about_us_information: `Welcome to MANNOL’s official page!

As the authorized distributor for SCT-Vertriebs GmbH and MANNOL in Uzbekistan, we are based in Tashkent. Our mission is to provide high-quality vehicle products quickly and affordably to our partners and customers.

We offer an extensive range of over 800 types of lubricants and fluids under the MANNOL brand, known for its competitive pricing and comprehensive selection. As a leader in the automotive spare parts market, we prioritize meeting the needs and expectations of our clients.

We invite you to explore new opportunities with us and assure you that your proposals will receive careful consideration. Our goal is to support your success with efficient service and a wide product range.

Thank you for choosing MANNOL!`,
      },
    },
    "ru-RU": {
      translation: {
        request_status_update:
          "Статус вашей последнее заявки обновлен на не активный. Если с вами не связались пожалуйста оставьте заявку снова или свяжетесь с нами по предоставленным контактам через панель 'Связаться с нами'.",
        request_saved: "Ваша заявка сохранена!",
        btn_list_requests: "Список Заявок",
        active_request_exist:
          "У вас уже есть активная заявка! Пожалуйста, дождитесь пока администраторы свяжутся с вам. Просим извинение за вынужденное ожидание.",
        prev: "⬅️пред",
        next: "след➡️",
        yes_sure: "Да, конечно",
        no_thanks: "Нет, спасибо",
        admin_removed_notification:
          "У вас забрали привилегии админа. Пожалуйста перезапустите бота коммандой /start.",
        admin_granted_notification:
          "Вам предаставили привилегии админа. Пожалуйста перезапустите бота коммандой /start",
        purchase_request_cancelled: "❌Отмена заявки",
        confirm_purchase_request:
          "Пожалуйста подтвердите что хотите оставить заявку.",
        btn_list_transactions: "Список Транзакций",
        last_transactions: "Последнии транзакции",
        btn_rules: "Правила Использования бонусов",
        coins: "Монет",
        write_comment: "Пожалуйста, оставьте комментарий:",
        bonuses_addition: "Начисление",
        purchase_request: "Оставить запрос",
        description: "Описание",
        transaction_date: "Дата транзакции",
        bonuses_removal: "Списание",
        provide_post_title: "Заголовок Поста:",
        provide_post_message: "Содержание Поста:",
        post_sent: "✅Пост отправлен!",
        confirm_button: "✅Подтвердить",
        registration_on_start: "Регистрация",
        send_post_button: "✍️Отправить Пост",
        balance_caption: "Ваш баланс",
        choose_option: "Меню",
        choose_language:
          "🇺🇸Please choose your language.\n🇷🇺Пожалуйста, выберите свой язык.",
        share_contact: "📱Пожалуйста, поделитесь своим контактом.",
        share_contact_button: "📱Поделиться контактом",
        contact_saved: "✅Контакт успешно сохранен.",
        credit_card_button: "💳Моя Кредитная карта",
        settings_button: "⚙️Настройки",
        btn_list_products: "🛒Товары",
        settings_menu_prompt: "⚙️Выберите настройки которые хотите изменить",
        back_button: "🔙Назад",
        change_language_button: "🌐Изменить язык",
        contact_us_button: "📞Связаться с нами",
        about_us_button: "📃О нас",
        language_changed: "✅Язык изменен.",
        post_creation_cancelled: "❌Пост НЕ отправлен.",
        btn_cancel_post_creation: "❌Отмена",

        about_us_information: `Добро пожаловать на официальную страницу MANNOL!

Являясь официальным дистрибьютором SCT-Vertriebs GmbH и MANNOL в Узбекистане, мы находимся в Ташкенте. Наша миссия — быстро и по доступной цене предоставлять высококачественную автомобильную продукцию нашим партнерам и клиентам.

Мы предлагаем обширный ассортимент из более чем 800 видов смазочных материалов и жидкостей под брендом MANNOL, известным своими конкурентоспособными ценами и широким выбором. Являясь лидером на рынке автомобильных запчастей, мы уделяем приоритетное внимание удовлетворению потребностей и ожиданий наших клиентов.

Мы приглашаем вас изучить новые возможности вместе с нами и заверяем вас, что ваши предложения будут тщательно рассмотрены. Наша цель — поддержать ваш успех с помощью эффективного обслуживания и широкого ассортимента продукции.

Благодарим вас за выбор MANNOL!`,

        contact_us_information: `Наши Контакты:

Ташкент: 100002, 
тел: +998-99-011-98-94, +998-93-397-35-72.

Ферганская долина: 150100, 
тел: +998-94-718-54-45.

Юго-запад: 140100, 
тел: +998-94-718-54-45.

Почта: info@mannol.uz, Mannoloilsale@mail.ru.

Сайт: mannol.uz .`,
      },
    },
    "uz-UZ":{

    }
  },
});

export default i18next;
