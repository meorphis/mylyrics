//
//  LyricsWidget.swift
//  LyricsWidget
//
//  Created by Eric Morphis on 1/21/24.
//

import WidgetKit
import SwiftUI
import FirebaseCore
import FirebaseFirestore

public struct BundleInfo: Codable {
  let group: String
  let key: String
  let type: String
  
  enum CodingKeys: String, CodingKey {
    case group
    case key
    case type
  }
}

public struct RawColor: Codable {
  let red: Int
  let blue: Int
  let green: Int
  
  enum CodingKeys: String, CodingKey {
    case red
    case blue
    case green
  }
}

public struct Song: Codable {
  let colors: [RawColor]
  
  enum CodingKeys: String, CodingKey {
    case colors
  }
}

public struct Recommendation: Codable {
  let bundleInfos: [BundleInfo]
  let lyrics: String
  let song: Song
  
  enum CodingKeys: String, CodingKey {
    case bundleInfos
    case lyrics
    case song
  }
}

public struct UserRecommendations: Codable {
  let recommendations: [Recommendation]

  enum CodingKeys: String, CodingKey {
    case recommendations
  }

}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
      SimpleEntry(date: Date(), emoji: "😀", colors: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
      let entry = SimpleEntry(date: Date(), emoji: "😀", colors: [])
        completion(entry)
    }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    print("fetching timeline");
    var entries: [SimpleEntry] = []
    FirebaseApp.configure()
    
    let db = Firestore.firestore()
    let prefs = UserDefaults(suiteName:"group.meorphis.mylyrics")
    let deviceId = prefs?.string(forKey: "deviceId") ?? "3E6KGENPTP";
    let docRef = db.collection("user-recommendations").document(deviceId);
    do {
      docRef.getDocument(as: UserRecommendations.self) {result in
        switch result {
        case .success(let document):
          let recommendations = document.recommendations.filter {
            $0.bundleInfos.contains {
              $0.type == "top"
            }
          }
          let lyrics = recommendations[0].lyrics;
          let colors = recommendations[0].song.colors;
          let currentDate = Date()
          for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, emoji: lyrics, colors: colors)
            entries.append(entry)
          }
          
          let timeline = Timeline(entries: entries, policy: .atEnd)
          completion(timeline)
        case .failure(let error):
          print("Error reading document: \(error)")
        }
      };
    }
  }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let emoji: String
    let colors: [RawColor]
}

struct LyricsWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
      let colors = entry.colors.map {
        Color(red: Double($0.red / 255), green: Double($0.green / 255), blue: Double($0.blue / 255))
      }

      VStack {
          Text("Time:")
          Text(entry.date, style: .time)

          Text("Emoji:")
          Text(entry.emoji)
      }
    }
}

struct LyricsWidget: Widget {
    let kind: String = "LyricsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                LyricsWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                LyricsWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("My Widget")
        .description("This is an example widget.")
    }
}

#Preview(as: .systemSmall) {
    LyricsWidget()
} timeline: {
  SimpleEntry(date: .now, emoji: "😀", colors: [])
  SimpleEntry(date: .now, emoji: "🤩", colors: [])
}
