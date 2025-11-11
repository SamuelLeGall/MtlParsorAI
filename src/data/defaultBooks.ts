import { BookDB } from "../models/bookmark";

export const defaultBooks: BookDB[] = [
  {
    id: "9046ada3-8b0d-46ae-bfd3-e6da672e922b", // if updated, impact defaultBookmarks.ts
    name: "Warhammer: Starting as a Planetary Governor",
    author: "Zaelum",
    synopsis:
      "In the 41st millennium, darkness is raging!\n" +
      "The human empire lost half of its territory.\n" +
      "Millions of planets are invaded by Chaos!\n" +
      "Famine is everywhere, crime is rampant, cults are everywhere...\n" +
      "The planet Erth, located on the dark side of the empire, is experiencing extreme suffering.\n" +
      "Fortunately, the savior Ron has arrived!\n" +
      "He awakens the essence of subspace and leads the development of the whole people!\n" +
      "Start with a small, ruined territory.\n" +
      "Farming, explosives, internal affairs, unifying the planet, building space warriors, forming the Star Sea Fleet, the Great Expedition...\n" +
      "When the regent came with an expeditionary fleet to regain the territory.\n" +
      "He looked at the extremely prosperous star field and the group of starships that covered the sky, and then looked at his broken spaceships, and he was suddenly confused...\n" +
      "Who is the empire?",
    readerDataConfigs: [
      {
        sourceSiteCode: "FAN_MTL", // if updated, impact defaultBookmarks.ts
        template:
          "https://www.fanmtl.com/novel/<SERIE_FRAGMENT>_<CHAPTER_NUMBER>.html",
        values: {
          SERIE_FRAGMENT: "6949856",
          CHAPTER_NUMBER: "1",
        },
      },
    ],
  },
  {
    id: "9046ada3-8b0d-46ae-bfd3-e6da672e733d", // if updated, impact defaultBookmarks.ts
    name: "Arc of Gunfire",
    author: "Kang_Si_Tan_Ding_Bo_Jue",
    synopsis:
      "Wang Zhong came to another world and got involved in the world war in this world.\n" +
      "The plug-in he got is a real-time strategy-like overhead perspective, and he can also see the view of his troops!\n" +
      'So he decisively started micro-manipulation: "Move the machine gun position five centimeters to the left! Place the anti-tank gun in the woods on the right!"\n' +
      "Three years passed like this. Wang Zhong looked at the marshal's scepter in his hand, and then at the double-headed eagle flag behind the emperor's imperial envoy.\n" +
      "\"There is an old saying in my hometown, 'Princes and generals should rather have their own kind.' Sir, do you know that?\"",
    readerDataConfigs: [
      {
        sourceSiteCode: "FAN_MTL", // if updated, impact defaultBookmarks.ts
        template:
          "https://www.fanmtl.com/novel/<SERIE_FRAGMENT>_<CHAPTER_NUMBER>.html",
        values: {
          SERIE_FRAGMENT: "arc-of-gunfire",
          CHAPTER_NUMBER: "1",
        },
      },
    ],
  },
];
