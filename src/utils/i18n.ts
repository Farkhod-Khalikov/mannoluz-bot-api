import i18next from "i18next";

i18next.init({
  lng: "ru-Ru", // Default language
  resources: {
    "en-US": {
      translation: {
        coins:"Coins",
        description: "Description",
        bonuses_addition: "Addition",
        bonuses_removal:"Removal",
        transaction_date:"Transaction Date",
        provide_post_title:"Post Title:",
        provide_post_message: "Post Message:",
        confirm_button: "✅Confirm",
        post_sent:"✅Succesfully send",
        registration_on_start:"Register ME",
        send_post_button:"✍️Send Post",
        btn_list_products: "🛒Products",
        balance_caption:"Your balance",
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
        coins:"Монет",
        bonuses_addition: "Добавление",
        description: "Описание",
        transaction_date:"Дата транзакции",
        bonuses_removal:"Вычитание",
        provide_post_title:"Заголовок Поста:",
        provide_post_message: "Содержание Поста:",
        post_sent:"✅Пост отправлен!",
        confirm_button: "✅Подтвердить",
        registration_on_start:"Регистрация",
        send_post_button:"✍️Отправить Пост",
        balance_caption:"Ваш баланс",
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
  },
});

export default i18next;
