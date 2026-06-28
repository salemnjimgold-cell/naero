export class CommunityPost {
  constructor({
    id, author, authorId, avatar, content, image,
    city, country = 'Hungary',
    likes = 0, comments = [], likedBy = [],
    timestamp = new Date().toISOString(),
    type = 'post', tags = [],
    verified = false, reported = false,
    demo = true,
  } = {}) {
    this.id = id;
    this.author = author;
    this.authorId = authorId || null;
    this.avatar = avatar || null;
    this.content = content;
    this.image = image || null;
    this.city = city || null;
    this.country = country;
    this.likes = likes;
    this.comments = comments;
    this.likedBy = likedBy;
    this.timestamp = timestamp;
    this.type = type;
    this.tags = tags;
    this.verified = verified;
    this.reported = reported;
    this.demo = demo;
  }

  toFirestore() {
    return { ...this };
  }

  static fromFirestore(id, data) {
    return new CommunityPost({ id, ...data });
  }

  static types = {
    post: { icon: 'chatbubble', color: '#06B6D4' },
    question: { icon: 'help-circle', color: '#F59E0B' },
    review: { icon: 'star', color: '#10B981' },
    warning: { icon: 'warning', color: '#EF4444' },
    tip: { icon: 'bulb', color: '#8B5CF6' },
    alert: { icon: 'alert-circle', color: '#EF4444' },
    event: { icon: 'calendar', color: '#3B82F6' },
  };
}

export class Comment {
  constructor({
    id, postId, author, authorId, avatar, content,
    timestamp = new Date().toISOString(), likes = 0,
  } = {}) {
    this.id = id;
    this.postId = postId;
    this.author = author;
    this.authorId = authorId;
    this.avatar = avatar;
    this.content = content;
    this.timestamp = timestamp;
    this.likes = likes;
  }
}
