const router = require("express").Router();
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

// Helpers
function isNonEmptyString(v, min = 1, max = 2000) {
  return typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
}

/**
 * POST /ads/:id/message
 * Body: { content }
 * - crée ou récupère la conversation liée à l'annonce
 * - envoie le message
 */
router.post("/ads/:id/message", auth, async (req, res, next) => {
  try {
    const adId = Number(req.params.id);
    if (!Number.isInteger(adId)) return res.status(400).json({ error: "Invalid ad id" });

    const { content } = req.body;
    if (!isNonEmptyString(content, 1, 2000)) {
      return res.status(400).json({ error: "Invalid content" });
    }

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });

    // On autorise le contact depuis une annonce publiée
    if (ad.status !== "PUBLISHED") {
      return res.status(403).json({ error: "Cannot message from an unpublished ad" });
    }

    // interdit de se contacter soi-même
    if (ad.authorId === req.user.id) {
      return res.status(400).json({ error: "You cannot contact yourself" });
    }

    // retrouve conversation existante (mêmes 2 participants + même annonce)
    let conversation = await prisma.conversation.findFirst({
      where: {
        adId,
        OR: [
          { user1Id: req.user.id, user2Id: ad.authorId },
          { user1Id: ad.authorId, user2Id: req.user.id }
        ]
      }
    });

    // sinon créer
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          adId,
          user1Id: req.user.id,
          user2Id: ad.authorId
        }
      });
    }

    // créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        content: content.trim()
      }
    });

    res.status(201).json({ conversationId: conversation.id, message });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /conversations
 * Inbox: conversations où l'utilisateur est participant + dernier message
 */
router.get("/", auth, async (req, res, next) => {
  try {
    const me = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ user1Id: me }, { user2Id: me }] },
      orderBy: { createdAt: "desc" },
      include: {
        ad: {
          select: { id: true, title: true, type: true, city: true }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, pseudo: true } } }
        }
      }
    });

    // format léger "inbox"
    const inbox = conversations.map((c) => {
      const last = c.messages[0] || null;
      return {
        id: c.id,
        ad: c.ad,
        lastMessage: last
          ? {
              id: last.id,
              content: last.content,
              createdAt: last.createdAt,
              sender: last.sender
            }
          : null,
        createdAt: c.createdAt
      };
    });

    res.json(inbox);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /conversations/:id
 * Voir une conversation (uniquement participants)
 */
router.get("/:id", auth, async (req, res, next) => {
  try {
    const convoId = Number(req.params.id);
    if (!Number.isInteger(convoId)) return res.status(400).json({ error: "Invalid conversation id" });

    const convo = await prisma.conversation.findUnique({
      where: { id: convoId },
      include: {
        ad: { select: { id: true, title: true, type: true, city: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, pseudo: true } } }
        }
      }
    });

    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    const me = req.user.id;
    const isParticipant = convo.user1Id === me || convo.user2Id === me;
    if (!isParticipant) return res.status(403).json({ error: "Forbidden" });

    res.json(convo);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /conversations/:id/messages
 * Envoyer un nouveau message (uniquement participants)
 */
router.post("/:id/messages", auth, async (req, res, next) => {
  try {
    const convoId = Number(req.params.id);
    if (!Number.isInteger(convoId)) return res.status(400).json({ error: "Invalid conversation id" });

    const { content } = req.body;
    if (!isNonEmptyString(content, 1, 2000)) {
      return res.status(400).json({ error: "Invalid content" });
    }

    const convo = await prisma.conversation.findUnique({ where: { id: convoId } });
    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    const me = req.user.id;
    const isParticipant = convo.user1Id === me || convo.user2Id === me;
    if (!isParticipant) return res.status(403).json({ error: "Forbidden" });

    const message = await prisma.message.create({
      data: {
        conversationId: convoId,
        senderId: me,
        content: content.trim()
      }
    });

    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});

module.exports = router;