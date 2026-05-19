package com.mykpokpo.Backend.conseil;

import java.time.LocalDateTime;

public record ConseilResponse(
        Long          id,
        String        title,
        String        content,
        String        category,
        String        authorName,
        boolean       published,
        LocalDateTime createdAt
) {
    public static ConseilResponse from(Conseil c) {
        return new ConseilResponse(
                c.getId(),
                c.getTitle(),
                c.getContent(),
                c.getCategory(),
                c.getAuthor().fullName(),
                c.isPublished(),
                c.getCreatedAt()
        );
    }
}
